import React, { useEffect, useState } from "react";

// PUBLIC_INTERFACE
/**
 * ArtFeed displays a responsive image grid with artworks from the Pexels API.
 * Applies ArtVista's color theme for cohesive look.
 */
function ArtFeed() {
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  useEffect(() => {
    const API_KEY = "o5vafzhrOvAK64hVAyrIH4LFL0zxxH3l1xpTiJ8otUfkzmQbWXNjaN1F";
    const ENDPOINT = "https://api.pexels.com/v1/search";
    const QUERY = "art OR painting OR abstract OR gallery";

    fetch(`${ENDPOINT}?query=${encodeURIComponent(QUERY)}&per_page=18`, {
      headers: {
        Authorization: API_KEY,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch artworks");
        return res.json();
      })
      .then((data) => {
        setArtworks(data.photos || []);
        setLoading(false);
      })
      .catch((err) => {
        setApiError("Failed to load artworks.");
        setLoading(false);
      });
  }, []);

  return (
    <section className="art-feed-section">
      <h2 className="art-feed-title">Featured Artworks</h2>
      {loading && (
        <div className="art-feed-loading">Loading artworks...</div>
      )}
      {apiError && <div className="art-feed-error">{apiError}</div>}
      {!loading && !apiError && (
        <div className="art-feed-grid">
          {artworks.length === 0 && (
            <div className="art-feed-empty">No artworks found.</div>
          )}
          {artworks.map((art, idx) => (
            <div className="art-feed-card" key={art.id || idx}>
              <a
                href={art.url}
                target="_blank"
                rel="noopener noreferrer"
                title={art.alt || "Artwork"}
              >
                <img
                  src={art.src && art.src.medium ? art.src.medium : art.src.original}
                  alt={art.alt || "Artwork"}
                  className="art-feed-image"
                />
              </a>
              <div className="art-feed-meta">
                <span className="art-feed-author">
                  {art.photographer ? `By ${art.photographer}` : ""}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default ArtFeed;
