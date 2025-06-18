import React, { useEffect, useState } from "react";

// PUBLIC_INTERFACE
/**
 * ArtFeed displays a responsive image grid with artworks from Pexels and Pixabay APIs.
 * Applies ArtVista's color theme for cohesive look.
 * Allows user to switch art source with tabs.
 */
function ArtFeed() {
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [source, setSource] = useState("Pexels"); // ["Pexels"|"Pixabay"]

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
              <div className="art-feed-meta">
                <span className="art-feed-author">
                  {author ? `By ${author}` : ""}
                </span>
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
