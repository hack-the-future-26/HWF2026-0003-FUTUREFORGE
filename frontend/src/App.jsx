import { useState } from "react";

function App() {
  const [search, setSearch] = useState("");

  const memories = [
    {
      title: "My First Memory",
      date: "Today",
      description: "A special moment saved in your digital memory vault.",
    },
    {
      title: "Family Memories",
      date: "Yesterday",
      description: "Important memories and moments with family.",
    },
    {
      title: "Favorite Moments",
      date: "Last week",
      description: "Your favorite moments collected in one safe place.",
    },
  ];

  const filteredMemories = memories.filter((memory) =>
    memory.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>Digital Memory Vault</h1>
          <p>Save, organize and revisit your memories.</p>
        </div>

        <button className="add-button">+ Add Memory</button>
      </header>

      <main className="main">
        <section className="hero">
          <h2>Your Memories</h2>
          <p>Keep your important moments organized in one place.</p>

          <input
            type="text"
            placeholder="Search memories..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="search"
          />
        </section>

        <section className="memory-grid">
          {filteredMemories.map((memory) => (
            <article className="memory-card" key={memory.title}>
              <div className="memory-icon">🗂️</div>

              <div>
                <h3>{memory.title}</h3>
                <small>{memory.date}</small>
                <p>{memory.description}</p>
              </div>
            </article>
          ))}
        </section>

        {filteredMemories.length === 0 && (
          <div className="empty">
            <h3>No memories found</h3>
            <p>Try a different search.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;