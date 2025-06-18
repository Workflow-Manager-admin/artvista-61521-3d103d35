import React, { useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { firestore } from "./firebase";
import { collection, addDoc, deleteDoc, query, where, onSnapshot } from "firebase/firestore";

import { doc } from "firebase/firestore";

// PUBLIC_INTERFACE
/**
 * ArtFeed displays a responsive image grid with artworks from Pexels and Pixabay APIs.
 * Applies ArtVista's color theme for cohesive look.
 * Allows user to switch art source with tabs.
 * Allows saving/unsaving artworks tied to user account.
 */
function ArtFeed() {
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [source, setSource] = useState("Pexels"); // ["Pexels"|"Pixabay"]
  const { user } = useAuth();
  const [saved, setSaved] = useState({}); // id -> {docId, ...artwork}

  // Query and API keys
  const QUERY = "art OR painting OR abstract OR gallery";
  const PEXELS_API_KEY = "o5vafzhrOvAK64hVAyrIH4LFL0zxxH3l1xpTiJ8otUfkzmQbWXNjaN1F";
  const PIXABAY_API_KEY = "50872548-89422cf3e7d17f61dfcb44fd6";
  const PEXELS_ENDPOINT = "https://api.pexels.com/v1/search";
  const PIXABAY_ENDPOINT = "https://pixabay.com/api/";

  // Fetch data based on source
  useEffect(() => {
    setLoading(true);
    setApiError(null);

    if (source === "Pexels") {
      fetch(`${PEXELS_ENDPOINT}?query=${encodeURIComponent(QUERY)}&per_page=18`, {
        headers: {
          Authorization: PEXELS_API_KEY,
        },
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch artworks from Pexels");
          return res.json();
        })
        .then((data) => {
          setArtworks(data.photos || []);
          setLoading(false);
        })
        .catch((err) => {
          setApiError("Failed to load artworks from Pexels.");
          setLoading(false);
        });
    } else if (source === "Pixabay") {
      // Pixabay does not require headers, query is "q"
      fetch(
        `${PIXABAY_ENDPOINT}?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(
          QUERY
        )}&image_type=photo&per_page=18&safesearch=true`
      )
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch artworks from Pixabay");
          return res.json();
        })
        .then((data) => {
          setArtworks(data.hits || []);
          setLoading(false);
        })
        .catch((err) => {
          setApiError("Failed to load artworks from Pixabay.");
          setLoading(false);
        });
    }
  }, [source]); // re-run on source switch

  // Sync user's saved artworks
  useEffect(() => {
    if (!user) {
      setSaved({});
      return;
    }
    const q = query(
      collection(firestore, "collections"),
      where("uid", "==", user.uid)
    );
    const unsub = onSnapshot(q, (snap) => {
      const list = {};
      snap.docs.forEach((d) => {
        if (d.data().artworkId) list[d.data().artworkId] = { ...d.data(), docId: d.id };
      });
      setSaved(list);
    });
    return () => unsub();
  }, [user]);

  // UI for switching sources
  function SourceTabs() {
    return (
      <div style={{ display: "flex", gap: 10, marginBottom: "1.4rem" }}>
        <button
          className="btn"
          style={{
            background:
              source === "Pexels"
                ? "var(--primary-color, #6A0DAD)"
                : "var(--base-light, #00ffff)",
            color: "white",
            borderBottom: source === "Pexels" ? "3px solid var(--accent-color, #FF69B4)" : "none",
            opacity: source === "Pexels" ? 1 : 0.72,
            fontWeight: source === "Pexels" ? 700 : 500,
          }}
          onClick={() => setSource("Pexels")}
          aria-pressed={source === "Pexels"}
        >
          Pexels
        </button>
        <button
          className="btn"
          style={{
            background:
              source === "Pixabay"
                ? "var(--primary-color, #6A0DAD)"
                : "var(--base-light, #00ffff)",
            color: "white",
            borderBottom: source === "Pixabay" ? "3px solid var(--accent-color, #FF69B4)" : "none",
            opacity: source === "Pixabay" ? 1 : 0.72,
            fontWeight: source === "Pixabay" ? 700 : 500,
          }}
          onClick={() => setSource("Pixabay")}
          aria-pressed={source === "Pixabay"}
        >
          Pixabay
        </button>
      </div>
    );
  }

  // Art grid unified rendering for both APIs
  function ArtGrid() {
    // Helper for Pexels or Pixabay fields

    // Save/unsave artwork for user collection
    async function handleSave(art, isPexels) {
      if (!user) {
        alert("Login to save artworks");
        return;
      }
      // Use art.id as artworkId. Save minimal fields
      await addDoc(collection(firestore, "collections"), {
        artworkId: "" + art.id,
        uid: user.uid,
        imageUrl: isPexels
          ? art.src && art.src.medium
            ? art.src.medium
            : art.src.original
          : art.webformatURL,
        link: isPexels ? art.url : art.pageURL,
        author: isPexels ? art.photographer : art.user,
        title: isPexels ? art.alt : (art.tags ? art.tags.split(",")[0] : "Artwork"),
        ts: Date.now()
      });
    }

    async function handleUnsave(artworkId) {
      if (!user || !saved[artworkId]) return;
      try {
        await deleteDoc(doc(firestore, "collections", saved[artworkId].docId));
      } catch (e) {
        alert("Failed to unsave artwork");
      }
    }

    return (
      <div className="art-feed-grid">
        {artworks.length === 0 && (
          <div className="art-feed-empty">No artworks found.</div>
        )}
        {artworks.map((art, idx) => {
          // Pexels and Pixabay have slightly different fields
          const isPexels = source === "Pexels";
          const imageUrl = isPexels
            ? art.src && art.src.medium
              ? art.src.medium
              : art.src.original
            : art.webformatURL;
          const artLink = isPexels
            ? art.url
            : art.pageURL;
          const author = isPexels
            ? art.photographer
            : art.user;
          const altText = isPexels
            ? art.alt || "Artwork"
            : art.tags ? art.tags.split(",")[0] : "Artwork";
          const artworkId = "" + art.id;
          const isSaved = !!user && !!saved[artworkId];

          return (
            <div className="art-feed-card" key={art.id || art.imageURL || idx}>
              <a
                href={artLink}
                target="_blank"
                rel="noopener noreferrer"
                title={altText}
              >
                <img
                  src={imageUrl}
                  alt={altText}
                  className="art-feed-image"
                />
              </a>
              <div className="art-feed-meta" style={{ justifyContent: "space-between" }}>
                <span className="art-feed-author">
                  {author ? `By ${author}` : ""}
                </span>
                {user && (
                  isSaved ? (
                    <button
                      className="btn"
                      type="button"
                      style={{
                        background: "#fff0f4",
                        color: "#6A0DAD",
                        fontWeight: 600,
                        fontSize: "0.97em"
                      }}
                      onClick={() => handleUnsave(artworkId)}
                    >
                      Unsave
                    </button>
                  ) : (
                    <button
                      className="btn"
                      type="button"
                      style={{
                        background: "#d4bee8",
                        color: "#6A0DAD",
                        fontWeight: 600,
                        fontSize: "0.97em"
                      }}
                      onClick={() => handleSave(art, isPexels)}
                    >
                      Save
                    </button>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <section className="art-feed-section">
      <h2 className="art-feed-title">Featured Artworks</h2>
      <SourceTabs />
      {loading && (
        <div className="art-feed-loading">Loading artworks...</div>
      )}
      {apiError && <div className="art-feed-error">{apiError}</div>}
      {!loading && !apiError && <ArtGrid />}
    </section>
  );
}

export default ArtFeed;
