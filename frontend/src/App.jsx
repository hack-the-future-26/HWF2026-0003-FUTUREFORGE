import { useEffect, useState } from "react";

const API_URL = "http://localhost:5000";

function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [authMode, setAuthMode] = useState("login");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Personal");
  const [location, setLocation] = useState("");
  const [memoryDate, setMemoryDate] = useState("");
  const [file, setFile] = useState(null);

  const [memories, setMemories] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [editingId, setEditingId] = useState(null);

  const resetMemoryForm = () => {
    setTitle("");
    setDescription("");
    setCategory("Personal");
    setLocation("");
    setMemoryDate("");
    setFile(null);
    setEditingId(null);
  };

  const loadMemories = async () => {
    const token = localStorage.getItem("token");

    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/memories`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load memories");
      }

      setMemories(data.memories || []);
    } catch (error) {
      console.error(error);
      setMessage("Unable to load memories.");
    }
  };

  useEffect(() => {
    if (user) {
      loadMemories();
    }
  }, [user]);

  // =========================
  // LOGIN / REGISTER
  // =========================

  const handleAuth = async (event) => {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      setMessage("Email and password are required.");
      return;
    }

    if (authMode === "register" && !name.trim()) {
      setMessage("Name is required.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const endpoint =
        authMode === "login"
          ? "/api/auth/login"
          : "/api/auth/register";

      const body =
        authMode === "login"
          ? { email, password }
          : { name, email, password };

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Authentication failed");
      }

      if (authMode === "register") {
        setMessage("Registration successful. Please login.");
        setAuthMode("login");
        setName("");
        setPassword("");
      } else {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        setUser(data.user);
        setPassword("");
        setMessage("");
      }
    } catch (error) {
      console.error(error);
      setMessage(error.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // LOGOUT
  // =========================

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUser(null);
    setMemories([]);
    setShowForm(false);
    setMessage("");
  };

  // =========================
  // ADD MEMORY
  // =========================

  const handleSaveMemory = async (event) => {
    event.preventDefault();

    if (!title.trim()) {
      setMessage("Please enter a memory title.");
      return;
    }

    if (!file) {
      setMessage("Please choose an image.");
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      setMessage("Please login first.");
      return;
    }

    const formData = new FormData();

    formData.append("title", title);
    formData.append("description", description);
    formData.append("category", category);
    formData.append("location", location);
    formData.append("memory_date", memoryDate);
    formData.append("file", file);

    try {
      setLoading(true);
      setMessage("");

      const response = await fetch(
        `${API_URL}/api/memories/upload`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Memory upload failed"
        );
      }

      setMessage("Memory saved successfully!");

      resetMemoryForm();
      setShowForm(false);

      await loadMemories();
    } catch (error) {
      console.error(error);
      setMessage(error.message || "Unable to save memory.");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // START EDIT
  // =========================

  const handleEdit = (memory) => {
    setEditingId(memory.id);

    setTitle(memory.title || "");
    setDescription(memory.description || "");
    setCategory(memory.category || "Personal");
    setLocation(memory.location || "");
    setMemoryDate(
      memory.memory_date
        ? memory.memory_date.split("T")[0]
        : ""
    );

    setFile(null);
    setMessage("");
    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =========================
  // UPDATE MEMORY
  // =========================

  const handleUpdateMemory = async (event) => {
    event.preventDefault();

    if (!title.trim()) {
      setMessage("Please enter a memory title.");
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      setMessage("Please login first.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const response = await fetch(
        `${API_URL}/api/memories/${editingId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title,
            description,
            category,
            location,
            memory_date: memoryDate || null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Memory update failed"
        );
      }

      setMessage("Memory updated successfully!");

      resetMemoryForm();
      setShowForm(false);

      await loadMemories();
    } catch (error) {
      console.error(error);
      setMessage(error.message || "Unable to update memory.");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // DELETE MEMORY
  // =========================

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this memory?"
    );

    if (!confirmed) return;

    const token = localStorage.getItem("token");

    if (!token) {
      setMessage("Please login first.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const response = await fetch(
        `${API_URL}/api/memories/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Memory deletion failed"
        );
      }

      setMessage("Memory deleted successfully!");

      await loadMemories();
    } catch (error) {
      console.error(error);
      setMessage(error.message || "Unable to delete memory.");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // IMAGE URL
  // =========================

  const getImageUrl = (filePath) => {
    if (!filePath) return null;

    const normalizedPath = filePath
      .replace(/\\/g, "/")
      .replace(/^\/+/, "");

    return `${API_URL}/${normalizedPath}`;
  };

  // =========================
  // SEARCH
  // =========================

  const filteredMemories = memories.filter((memory) =>
    `${memory.title || ""} ${memory.description || ""} ${
      memory.category || ""
    } ${memory.location || ""}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  // =========================
  // AUTH PAGE
  // =========================

  if (!user) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-icon">🗂️</div>

          <h1>Digital Memory Vault</h1>

          <p className="auth-subtitle">
            Securely save, organize and revisit your
            special memories.
          </p>

          <div className="auth-tabs">
            <button
              className={
                authMode === "login"
                  ? "auth-tab active"
                  : "auth-tab"
              }
              onClick={() => {
                setAuthMode("login");
                setMessage("");
              }}
            >
              Login
            </button>

            <button
              className={
                authMode === "register"
                  ? "auth-tab active"
                  : "auth-tab"
              }
              onClick={() => {
                setAuthMode("register");
                setMessage("");
              }}
            >
              Register
            </button>
          </div>

          {message && (
            <div className="message">
              {message}
            </div>
          )}

          <form onSubmit={handleAuth}>
            {authMode === "register" && (
              <label>
                Full Name

                <input
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                />
              </label>
            )}

            <label>
              Email

              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
              />
            </label>

            <label>
              Password

              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
              />
            </label>

            <button
              type="submit"
              className="primary-button"
              disabled={loading}
            >
              {loading
                ? "Please wait..."
                : authMode === "login"
                ? "Login"
                : "Create Account"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // =========================
  // DASHBOARD
  // =========================

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>Digital Memory Vault</h1>

          <p>
            Welcome back, {user.name || "User"}.
          </p>
        </div>

        <div className="header-actions">
          <button
            className="add-button"
            onClick={() => {
              resetMemoryForm();
              setMessage("");
              setShowForm(true);
            }}
          >
            + Add Memory
          </button>

          <button
            className="logout-button"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </header>

      {message && (
        <div className="message">
          {message}
        </div>
      )}

      {/* =========================
          MEMORY FORM
      ========================= */}

      {showForm && (
        <section className="memory-form">
          <div className="form-header">
            <div>
              <h2>
                {editingId
                  ? "Edit Memory"
                  : "Add a Memory"}
              </h2>

              <p>
                {editingId
                  ? "Update your saved memory."
                  : "Save a special moment to your digital vault."}
              </p>
            </div>

            <button
              type="button"
              className="close-button"
              onClick={() => {
                resetMemoryForm();
                setShowForm(false);
              }}
            >
              ×
            </button>
          </div>

          <form
            onSubmit={
              editingId
                ? handleUpdateMemory
                : handleSaveMemory
            }
          >
            <label>
              Memory Title

              <input
                type="text"
                placeholder="e.g. Hackathon Day"
                value={title}
                onChange={(event) =>
                  setTitle(event.target.value)
                }
              />
            </label>

            <label>
              Description

              <textarea
                placeholder="Describe your memory..."
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                rows="4"
              />
            </label>

            <label>
              Category

              <select
                value={category}
                onChange={(event) =>
                  setCategory(event.target.value)
                }
              >
                <option>Personal</option>
                <option>Travel</option>
                <option>Family</option>
                <option>Friends</option>
                <option>Event</option>
                <option>Nature</option>
                <option>Food</option>
                <option>Other</option>
              </select>
            </label>

            <label>
              Location

              <input
                type="text"
                placeholder="e.g. Visakhapatnam"
                value={location}
                onChange={(event) =>
                  setLocation(event.target.value)
                }
              />
            </label>

            <label>
              Memory Date

              <input
                type="date"
                value={memoryDate}
                onChange={(event) =>
                  setMemoryDate(event.target.value)
                }
              />
            </label>

            {/* Image is required only when adding */}
            {!editingId && (
              <label>
                Memory Image

                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    setFile(
                      event.target.files[0] || null
                    )
                  }
                />
              </label>
            )}

            {file && (
              <p className="selected-file">
                Selected: {file.name}
              </p>
            )}

            {editingId && (
              <p className="selected-file">
                Existing image will be kept.
              </p>
            )}

            <div className="form-actions">
              <button
                type="submit"
                className="save-button"
                disabled={loading}
              >
                {loading
                  ? editingId
                    ? "Updating..."
                    : "Saving..."
                  : editingId
                  ? "Update Memory"
                  : "Save Memory"}
              </button>

              <button
                type="button"
                className="cancel-button"
                onClick={() => {
                  resetMemoryForm();
                  setShowForm(false);
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      {/* =========================
          MAIN
      ========================= */}

      <main className="main">
        <section className="hero">
          <h2>Your Memories</h2>

          <p>
            Keep your important moments organized in one place.
          </p>

          <input
            type="text"
            placeholder="Search memories..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            className="search"
          />
        </section>

        {/* =========================
            MEMORY GRID
        ========================= */}

        <section className="memory-grid">
          {filteredMemories.map((memory) => (
            <article
              className="memory-card"
              key={memory.id}
            >
              {memory.file_path ? (
                <img
                  src={getImageUrl(memory.file_path)}
                  alt={memory.title || "Memory"}
                  className="memory-image"
                  onError={(event) => {
                    event.currentTarget.style.display =
                      "none";
                  }}
                />
              ) : (
                <div className="memory-icon">
                  🖼️
                </div>
              )}

              <div className="memory-content">
                <div className="memory-title-row">
                  <h3>
                    {memory.title ||
                      "Untitled Memory"}
                  </h3>

                  <div className="memory-actions">
                    <button
                      className="edit-button"
                      onClick={() =>
                        handleEdit(memory)
                      }
                    >
                      Edit
                    </button>

                    <button
                      className="delete-button"
                      onClick={() =>
                        handleDelete(memory.id)
                      }
                      disabled={loading}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <small>
                  {memory.memory_date
                    ? new Date(
                        memory.memory_date
                      ).toLocaleDateString()
                    : memory.created_at
                    ? new Date(
                        memory.created_at
                      ).toLocaleDateString()
                    : "Recently"}
                </small>

                <p>
                  {memory.description ||
                    "A saved memory from your vault."}
                </p>

                {memory.category && (
                  <span className="category">
                    {memory.category}
                  </span>
                )}

                {memory.location && (
                  <small>
                    📍 {memory.location}
                  </small>
                )}

                {memory.tags &&
                  Array.isArray(memory.tags) &&
                  memory.tags.length > 0 && (
                    <div className="tags">
                      {memory.tags.map(
                        (tag, index) => (
                          <span key={index}>
                            #{tag}
                          </span>
                        )
                      )}
                    </div>
                  )}
              </div>
            </article>
          ))}
        </section>

        {filteredMemories.length === 0 && (
          <div className="empty">
            <h3>No memories found</h3>

            <p>
              Click "+ Add Memory" to save your first
              memory.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;