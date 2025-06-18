import React, { useEffect, useState } from "react";
import { firestore } from "./firebase";
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc } from "firebase/firestore";
import { useAuth } from "./AuthContext";

// PUBLIC_INTERFACE
/**
 * MyCollection displays and manages per-user saved artworks.
 * Only accessible if user is logged in; disables if not.
 */
function MyCollection() {
  const { user } = useAuth();
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch saved artworks for this user
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    // Saved artworks collection per user: collection("collections"), filter by uid
    const q = query(
      collection(firestore, "collections"),
      where("uid", "==", user.uid)
    );
    const unsub = onSnapshot(q, (snap) => {
      setArtworks(
        snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
      );
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  // Remove artwork from collection
  const handleRemove = async (id) => {
    try {
      await deleteDoc(doc(firestore, "collections", id));
    } catch (e) {
      alert("Failed to remove artwork");
    }
  };

  if (!user) {
    return <div style={{ padding: 30, fontSize: "1.1em" }}>Login to view your collection.</div>;
  }

  return (
    <section className="art-feed-section" style={{ minHeight: 320 }}>
      <h2 className="art-feed-title">My Collection</h2>
      {loading ? (
        <div className="art-feed-loading">Loading collection...</div>
      ) : artworks.length === 0 ? (
        <div className="art-feed-empty">You haven't saved any artworks yet.</div>
      ) : (
        <div className="art-feed-grid">
          {artworks.map((art) => (
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
                  style={{
                    background: "#fff0f4",
                    color: "#6A0DAD",
                    fontWeight: 600,
                    fontSize: "0.97em",
                  }}
                  onClick={() => handleRemove(art.id)}
                >
                  Remove
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
