import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "https://hwf2026-0003-futureforge.onrender.com";

function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [authMode, setAuthMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [page, setPage] = useState("home");
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
        headers: { Authorization: `Bearer ${token}` },
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
    if (user) loadMemories();
  }, [user]);

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
        headers: { "Content-Type": "application/json" },
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
        setPage("home");
      }
    } catch (error) {
      console.error(error);
      setMessage(error.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setMemories([]);
    setShowForm(false);
    setPage("home");
    setMessage("");
  };

  const openAddMemory = () => {
    resetMemoryForm();
    setMessage("");
    setShowForm(true);
    setPage("add");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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

      const response = await fetch(`${API_URL}/api/memories/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Memory upload failed");
      }

      setMessage("Memory saved successfully!");
      resetMemoryForm();
      setShowForm(false);
      setPage("memories");
      await loadMemories();
    } catch (error) {
      console.error(error);
      setMessage(error.message || "Unable to save memory.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (memory) => {
    setEditingId(memory.id);
    setTitle(memory.title || "");
    setDescription(memory.description || "");
    setCategory(memory.category || "Personal");
    setLocation(memory.location || "");
    setMemoryDate(
      memory.memory_date ? memory.memory_date.split("T")[0] : ""
    );
    setFile(null);
    setMessage("");
    setShowForm(true);
    setPage("add");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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

      const response = await fetch(`${API_URL}/api/memories/${editingId}`, {
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
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Memory update failed");
      }

      setMessage("Memory updated successfully!");
      resetMemoryForm();
      setShowForm(false);
      setPage("memories");
      await loadMemories();
    } catch (error) {
      console.error(error);
      setMessage(error.message || "Unable to update memory.");
    } finally {
      setLoading(false);
    }
  };

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

      const response = await fetch(`${API_URL}/api/memories/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Memory deletion failed");
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

  const getImageUrl = (filePath) => {
    if (!filePath) return null;
    const normalizedPath = filePath
      .replace(/\\/g, "/")
      .replace(/^\/+/, "");
    return `${API_URL}/${normalizedPath}`;
  };

  const filteredMemories = memories.filter((memory) =>
    `${memory.title || ""} ${memory.description || ""} ${
      memory.category || ""
    } ${memory.location || ""}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const goTo = (nextPage) => {
    setMessage("");
    setShowForm(nextPage === "add");
    setPage(nextPage);
    if (nextPage !== "add") resetMemoryForm();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!user) {
    return (
      <div className="auth-page">
        <div className="auth-background-shape shape-one" />
        <div className="auth-background-shape shape-two" />

        <div className="auth-card">
          <div className="brand auth-brand">
            <div className="brand-icon">▣</div>
            <span>Digital Memory Vault</span>
          </div>

          <div className="auth-icon-large">▣</div>

          <h1>
            {authMode === "login" ? "Welcome Back!" : "Create Your Account"}
          </h1>

          <p className="auth-subtitle">
            {authMode === "login"
              ? "Sign in to access your memories."
              : "Start your journey to save your memories."}
          </p>

          {message && <div className="message auth-message">{message}</div>}

          <form onSubmit={handleAuth} className="auth-form">
            {authMode === "register" && (
              <label>
                Full Name
                <div className="input-with-icon">
                  <span>♙</span>
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                  />
                </div>
              </label>
            )}

            <label>
              Email address
              <div className="input-with-icon">
                <span>✉</span>
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
            </label>

            <label>
              Password
              <div className="input-with-icon">
                <span>▣</span>
                <input
                  type="password"
                  placeholder={
                    authMode === "register"
                      ? "Create a password"
                      : "Password"
                  }
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <span className="password-eye">◉</span>
              </div>
            </label>

            {authMode === "login" && (
              <div className="auth-options">
                <label className="remember">
                  <input type="checkbox" />
                  <span>Remember me</span>
                </label>
                <button type="button" className="text-link">
                  Forgot password?
                </button>
              </div>
            )}

            <button type="submit" className="primary-button" disabled={loading}>
              {loading
                ? "Please wait..."
                : authMode === "login"
                ? "Login"
                : "Register"}
            </button>
          </form>

          <div className="auth-footer">
            {authMode === "login" ? (
              <>
                Don't have an account?{" "}
                <button
                  type="button"
                  className="text-link"
                  onClick={() => {
                    setAuthMode("register");
                    setMessage("");
                  }}
                >
                  Register
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  className="text-link"
                  onClick={() => {
                    setAuthMode("login");
                    setMessage("");
                  }}
                >
                  Login
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="site-header">
        <button className="brand brand-button" onClick={() => goTo("home")}>
          <div className="brand-icon">▣</div>
          <span>Digital Memory Vault</span>
        </button>

        <nav className="nav-links">
          <button
            className={page === "home" ? "nav-link active" : "nav-link"}
            onClick={() => goTo("home")}
          >
            Home
          </button>
          <button
            className={page === "memories" ? "nav-link active" : "nav-link"}
            onClick={() => goTo("memories")}
          >
            My Memories
          </button>
          <button
            className={page === "memories" ? "nav-link" : "nav-link"}
            onClick={() => {
              setPage("memories");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            Search
          </button>
        </nav>

        <div className="profile-area">
          <div className="profile-avatar">♙</div>
          <span>{user.name || "User"}</span>
          <span className="chevron">⌄</span>
        </div>
      </header>

      {message && <div className="message page-message">{message}</div>}

      {page === "home" && (
        <main className="home-page">
          <section className="hero-section">
            <div className="hero-copy">
              <span className="eyebrow">Your Memories, Forever</span>
              <h1>Digital Memory Vault</h1>
              <p>
                Save, organize and revisit your special moments.
                <br />
                With AI-powered insights, your memories are
                <br />
                more than just photos — they're stories.
              </p>

              <div className="hero-buttons">
                <button className="primary-button hero-button" onClick={openAddMemory}>
                  Get Started <span>→</span>
                </button>
                <button className="secondary-button" onClick={() => goTo("memories")}>
                  Learn More
                </button>
              </div>
            </div>

            <div className="hero-visual" aria-hidden="true">
              <div className="soft-blob blob-a" />
              <div className="soft-blob blob-b" />
              <div className="photo-stack">
                <div className="stack-card back-card" />
                <div className="stack-card middle-card" />
                <div className="stack-card front-card">
                  <div className="fake-landscape">
                    <div className="sun" />
                    <div className="mountain mountain-one" />
                    <div className="mountain mountain-two" />
                    <div className="water" />
                  </div>
                  <span className="ai-badge">AI</span>
                </div>
              </div>
              <span className="float-icon cloud">☁</span>
              <span className="float-icon lock">▣</span>
              <span className="float-icon picture">▧</span>
              <span className="sparkle sparkle-one">✦</span>
              <span className="sparkle sparkle-two">✦</span>
            </div>
          </section>

          <section className="feature-row">
            <Feature icon="♢" title="Secure" text={<>Your memories are safe with<br />end-to-end security</>} />
            <Feature icon="✣" title="AI Powered" text={<>Get smart insights and<br />summaries</>} />
            <Feature icon="▱" title="Easy to Organize" text={<>Search, tag and find<br />instantly</>} />
            <Feature icon="♧" title="Access Anywhere" text={<>Your memories, anytime,<br />anywhere</>} />
          </section>
        </main>
      )}

      {page === "memories" && (
        <main className="content-page">
          <section className="page-heading">
            <div>
              <h1>My Memories</h1>
              <p>Keep your important moments organized in one place.</p>
            </div>

            <div className="search-tools">
              <div className="search-box">
                <span>⌕</span>
                <input
                  type="text"
                  placeholder="Search memories..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
              <button className="filter-button">⚱ Filter</button>
            </div>
          </section>

          <section className="memory-grid">
            {filteredMemories.map((memory) => (
              <article className="memory-card" key={memory.id}>
                {memory.file_path ? (
                  <img
                    src={getImageUrl(memory.file_path)}
                    alt={memory.title || "Memory"}
                    className="memory-image"
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="memory-image memory-placeholder">▧</div>
                )}

                <div className="memory-content">
                  <div className="card-top-row">
                    <div className="tags">
                      {memory.category && (
                        <span className="tag tag-purple">{memory.category}</span>
                      )}
                      {memory.tags &&
                        Array.isArray(memory.tags) &&
                        memory.tags.slice(0, 2).map((tag, index) => (
                          <span className="tag tag-soft" key={index}>
                            {tag}
                          </span>
                        ))}
                    </div>
                    <button className="more-button">⋮</button>
                  </div>

                  <h3>{memory.title || "Untitled Memory"}</h3>

                  <div className="memory-meta">
                    <span>
                      ◷{" "}
                      {memory.memory_date
                        ? new Date(memory.memory_date).toLocaleDateString()
                        : memory.created_at
                        ? new Date(memory.created_at).toLocaleDateString()
                        : "Recently"}
                    </span>
                    {memory.location && <span>⌖ {memory.location}</span>}
                  </div>

                  {memory.description && (
                    <p className="memory-description">{memory.description}</p>
                  )}

                  <div className="card-actions">
                    <button
                      className="icon-action edit"
                      onClick={() => handleEdit(memory)}
                      aria-label="Edit memory"
                    >
                      ✎
                    </button>
                    <button
                      className="icon-action delete"
                      onClick={() => handleDelete(memory.id)}
                      disabled={loading}
                      aria-label="Delete memory"
                    >
                      ♲
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </section>

          {filteredMemories.length === 0 && (
            <div className="empty">
              <div className="empty-icon">▧</div>
              <h3>No memories found</h3>
              <p>Click “Add Memory” to save your first memory.</p>
              <button className="primary-button" onClick={openAddMemory}>
                + Add Memory
              </button>
            </div>
          )}
        </main>
      )}

      {page === "add" && showForm && (
        <main className="add-page">
          <section className="add-heading">
            <button
              className="back-button"
              onClick={() => goTo("memories")}
              aria-label="Back"
            >
              ←
            </button>
            <div>
              <h1>{editingId ? "Edit Memory" : "Add Memory"}</h1>
              <p>Save a special moment to your digital vault.</p>
            </div>
          </section>

          <div className="add-layout">
            <section className="memory-details-card">
              <h2>Memory Details</h2>

              <form
                onSubmit={editingId ? handleUpdateMemory : handleSaveMemory}
                className="memory-form-new"
              >
                {!editingId && (
                  <label className="upload-box">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) =>
                        setFile(event.target.files[0] || null)
                      }
                    />
                    <span className="upload-icon">▧</span>
                    <strong>Choose Image</strong>
                    <small>
                      Click to upload or drag and drop
                      <br />
                      (JPG, PNG - Max 5MB)
                    </small>
                    {file && <em>{file.name}</em>}
                  </label>
                )}

                {editingId && (
                  <div className="existing-image-note">
                    Existing image will be kept.
                  </div>
                )}

                <label>
                  Title <span className="required">*</span>
                  <input
                    type="text"
                    placeholder="e.g. Hackathon Day"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                  />
                </label>

                <label>
                  Description
                  <textarea
                    placeholder="Describe your memory..."
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    rows="3"
                  />
                </label>

                <div className="two-column-fields">
                  <label>
                    Category
                    <select
                      value={category}
                      onChange={(event) => setCategory(event.target.value)}
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
                      onChange={(event) => setLocation(event.target.value)}
                    />
                  </label>
                </div>

                <label className="date-field">
                  Memory Date
                  <input
                    type="date"
                    value={memoryDate}
                    onChange={(event) => setMemoryDate(event.target.value)}
                  />
                </label>

                <div className="form-actions">
                  <button
                    type="submit"
                    className="primary-button save-memory-button"
                    disabled={loading}
                  >
                    {loading
                      ? editingId
                        ? "Updating..."
                        : "Saving..."
                      : editingId
                      ? "Update Memory"
                      : "▣ Save Memory"}
                  </button>
                </div>
              </form>
            </section>

            <aside className="ai-sidebar">
              <div className="ai-card">
                <div className="ai-icon">✦</div>
                <h2>Let AI Analyze Your Memory</h2>
                <p>Get automatic insights, tags and summaries for your memory.</p>
                <button className="ai-button" type="button">
                  ✦ Enable AI Analysis
                </button>
              </div>

              <div className="tips-card">
                <h3>Tips</h3>
                <p><span>●</span> Add a clear and meaningful title</p>
                <p><span>●</span> Write a short description</p>
                <p><span>●</span> Choose the right category</p>
                <p><span>●</span> Add location and date (optional)</p>
              </div>
            </aside>
          </div>
        </main>
      )}
    </div>
  );
}

function Feature({ icon, title, text }) {
  return (
    <div className="feature-item">
      <div className="feature-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

export default App;
