import React, { useEffect, useState } from "react";

// PUBLIC_INTERFACE
/**
 * ArtOfTheDay fetches and displays a featured daily artwork from Pexels or Pixabay.
 * - Uses a deterministic daily index for the "art of the day" (changes every day, not every reload).
 * - Falls back gracefully between both APIs if one fails.
 * - Presents the artwork in a visually featured style above the feed.
 */
function ArtOfTheDay() {
  const [artwork, setArtwork] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  // General query for art; refine for more specific results if needed
  const QUERY = "art painting abstract gallery";
  const PEXELS_API_KEY = "o5vafzhrOvAK64hVAyrIH4LFL0zxxH3l1xpTiJ8otUfkzmQbWXNjaN1F";
  const PIXABAY_API_KEY = "50872548-89422cf3e7d17f61dfcb44fd6";
  const PEXELS_ENDPOINT = "https://api.pexels.com/v1/search";
  const PIXABAY_ENDPOINT = "https://pixabay.com/api/";

  // Helper: Deterministic daily index based on Date (changes once per day)
  function getDailyIndex(count) {
    const today = new Date();
    // ISO date string to ensure UTC consistency
    const daySeed = today.toISOString().substring(0, 10);
    // Simple hash: convert date string to integer
    let hash = 0;
    for (let i = 0; i < daySeed.length; i++) {
      hash = (hash * 31 + daySeed.charCodeAt(i)) % 65521;
    }
    // Return index in range [0, count-1]
    return count > 0 ? hash % count : 0;
  }

  // Fetch both APIs and pick "art of the day"
  useEffect(() => {
    setLoading(true);
    setApiError(null);
    setArtwork(null);

    // Try to get from Pexels first
    fetch(`${PEXELS_ENDPOINT}?query=${encodeURIComponent(QUERY)}&per_page=24`, {
      headers: {
        Authorization: PEXELS_API_KEY,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch from Pexels");
        return res.json();
      })
      .then((data) => {
        if (data.photos && Array.isArray(data.photos) && data.photos.length) {
          const idx = getDailyIndex(data.photos.length);
          const art = data.photos[idx];
          setArtwork({
            src: art.src && (art.src.large2x || art.src.large || art.src.original),
            title: art.alt || "Art of the Day",
            author: art.photographer,
            link: art.url,
            platform: "Pexels",
          });
          setLoading(false);
        } else {
          throw new Error("No artwork found in Pexels");
        }
      })
      .catch(() => {
        // Fallback: Pixabay
        fetch(
          `${PIXABAY_ENDPOINT}?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(
            QUERY
          )}&image_type=photo&per_page=24&safesearch=true`
        )
          .then((res) => {
            if (!res.ok) throw new Error("Failed to fetch from Pixabay");
            return res.json();
          })
          .then((data) => {
            if (data.hits && Array.isArray(data.hits) && data.hits.length > 0) {
              const idx = getDailyIndex(data.hits.length);
              const art = data.hits[idx];
              setArtwork({
                src: art.largeImageURL || art.webformatURL,
                title: art.tags ? `Art of the Day: ${art.tags.split(",")[0]}` : "Art of the Day",
                author: art.user,
                link: art.pageURL,
                platform: "Pixabay",
              });
              setLoading(false);
            } else {
              setApiError("No artwork found for today.");
              setLoading(false);
            }
          })
          .catch(() => {
            setApiError("Failed to fetch 'Art of the Day' from both APIs.");
            setLoading(false);
          });
      });
    // Intentionally empty dependency (fetches once on mount)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section
      className="art-of-the-day-banner"
      style={{
        background: "linear-gradient(120deg, var(--primary-tint,#d4bee8) 80%, var(--accent-tint,#ffe2f1))",
        borderRadius: "22px",
        boxShadow: "0 5px 30px 0 rgba(141,95,197,0.13)",
        marginBottom: "2.1rem",
        padding: "21px 11px 18px 11px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        minHeight: 260,
        position: "relative",
        overflow: "hidden",
      }}
      aria-label="Art of the Day Banner"
    >
      <h2
        style={{
          color: "var(--primary-color,#6A0DAD)",
          fontWeight: 800,
          fontSize: "2.1rem",
          margin: "0 0 0.79em 0",
          letterSpacing: "0.02em"
        }}
      >
        Art of the Day
      </h2>
      {loading && (
        <div
          style={{
            color: "var(--accent-color,#FF69B4)",
            fontSize: "1.17rem",
            margin: "1.7em 0",
            fontWeight: 500,
            letterSpacing: "0.007em"
          }}
        >
          Loading artwork...
        </div>
      )}
      {apiError && (
        <div
          style={{
            color: "#c74a77",
            background: "rgba(255,137,182,0.08)",
            padding: "11px 26px",
            borderRadius: "16px",
            margin: "1em 0"
          }}
        >
          {apiError}
        </div>
      )}
      {!loading && artwork && (
        <a
          href={artwork.link}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textDecoration: "none",
            width: "100%",
            maxWidth: 540,
            position: "relative"
          }}
          title="See more about this artwork"
        >
          <img
            src={artwork.src}
            alt={artwork.title}
            style={{
              width: "100%",
              maxHeight: 280,
              objectFit: "cover",
              borderRadius: "17px",
              boxShadow: "0 1px 13px 0 rgba(76,52,117,0.14)",
              marginBottom: "18px",
              background: "#fcfaff"
            }}
          />
          <div
            style={{
              color: "var(--primary-color,#6A0DAD)",
              fontWeight: 600,
              fontSize: "1.22rem",
              background: "rgba(255,255,255,0.89)",
              borderRadius: "12px",
              padding: "6px 21px 6px 14px",
              marginBottom: ".4em",
              boxShadow: "0 1px 4px 0 rgba(200,150,220,0.09)"
            }}
          >
            {artwork.title}
          </div>
          <div
            style={{
              color: "var(--text-secondary,#8969a9)",
              fontSize: "1.04rem",
              fontWeight: 400,
              marginBottom: ".4em"
            }}
          >
            By {artwork.author} <span style={{ opacity: 0.57, fontSize: "0.97em" }}>({artwork.platform})</span>
          </div>
        </a>
      )}
    </section>
  );
}

export default ArtOfTheDay;
