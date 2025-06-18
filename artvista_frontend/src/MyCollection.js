import React, { useEffect, useState } from "react";
import { useAuth } from "./AuthContext";

// PUBLIC_INTERFACE
/**
 * MyCollection displays all artworks saved by the user (username-only, via localStorage).
 * Artworks are shown in a grid with a "Remove" button for each item. Removals update UI instantly.
 * The page uses the main ArtFeed grid visuals for consistency.
 * - Loads and syncs from localStorage (per-username collection)
 * - Shows message if not logged in or if collection empty
 */
function MyCollection() {
  const { user } = useAuth();
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- Load user's saved artworks ---
  useEffect(() => {
    if (!user) {
      setArtworks([]);
      setLoading(false);
      return;
    }
    function loadLocal() {
      setLoading(true);
      try {
        const arr = JSON.parse(localStorage.getItem(`collections__${user}`) || "[]");
        setArtworks(arr.map(item => ({
          ...item,
          id: item.artworkId,
          isLocal: true
        })));
      } catch {
        setArtworks([]);
      }
      setLoading(false);
    }
    loadLocal();
    window.addEventListener("storage", loadLocal);
    return () => window.removeEventListener("storage", loadLocal);
  }, [user]);

  // --- Remove artwork (localStorage only) ---
  const handleRemove = async (id) => {
    if (!user) return;
    let arr;
    try {
      arr = JSON.parse(localStorage.getItem(`collections__${user}`) || "[]");
    } catch {
      arr = [];
    }
    arr = arr.filter((rec) => rec.artworkId !== id);
    localStorage.setItem(`collections__${user}`, JSON.stringify(arr));
    setArtworks(arr.map(item => ({ ...item, id: item.artworkId, isLocal: true })));
  };

  return (
    <section className="art-feed-section" style={{ minHeight: 320 }}>
      <h2 className="art-feed-title">My Collection</h2>
      {loading ? (
        <div className="art-feed-loading">Loading collection...</div>
      ) : !user ? (
        <div className="art-feed-empty">
          Please log in with a username to view your collection.
        </div>
      ) : artworks.length === 0 ? (
        <div className="art-feed-empty">
          You haven't saved any artworks yet.
        </div>
      ) : (
        <div className="art-feed-grid">
          {artworks.map(art => (
            <div className="art-feed-card" key={art.id}>
              <a
                href={art.link}
                target="_blank"
                rel="noopener noreferrer"
                title={art.title || "Artwork"}
              >
                <img
                  src={art.imageUrl}
                  alt={art.title || "Artwork"}
                  className="art-feed-image"
                  style={{ objectFit: "cover" }}
                />
              </a>
              <div className="art-feed-meta" style={{ justifyContent: "space-between" }}>
                <span className="art-feed-author">
                  {art.author && `By ${art.author}`}
                </span>
                <button
                  className="btn"
                  type="button"
                  aria-label="Remove artwork from collection"
                  style={{
                    background: "#fff0f4",
                    color: "#c74a77",
                    fontWeight: 700,
                    fontSize: "1em",
                    border: "none",
                    boxShadow: "none",
                    cursor: "pointer",
                    transition: "background 0.19s",
                  }}
                  onClick={() => handleRemove(art.id)}
                >
                  {/* Trash Icon (inline SVG) */}
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <svg width="18" height="18" fill="none" stroke="#c74a77" strokeWidth="2" viewBox="0 0 22 22" aria-hidden="true"><path d="M4 7h14M9 11v4M13 11v4M6.2 7l1.14 10.15A2 2 0 0 0 9.33 19h3.34a2 2 0 0 0 1.99-1.85L15.8 7M8 7V5.5A1.5 1.5 0 0 1 9.5 4h3A1.5 1.5 0 0 1 14 5.5V7" /></svg>
                    Remove
                  </span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default MyCollection;
