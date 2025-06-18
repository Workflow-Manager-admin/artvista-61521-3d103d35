import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "./AuthContext";

// PUBLIC_INTERFACE
/**
 * ArtFeed displays a responsive image grid with artworks from Pexels and Pixabay APIs.
 * Applies ArtVista's color theme for cohesive look.
 * Live keyword search & filter UI for style, color, orientation; fetches update as user types or changes filters.
 * Allows user to switch art source with tabs, and saving/unsaving artworks tied to user account (or localStorage by username).
 */
function ArtFeed() {
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [source, setSource] = useState("Pexels"); // ["Pexels"|"Pixabay"]
  const { user } = useAuth();
  const [saved, setSaved] = useState({}); // Format: { [artworkId]: { ...meta, isLocal: true } }

  // Sync saved artworks: always localStorage, keyed by username
  useEffect(() => {
    function getLocal() {
      try {
        if (!user) {
          setSaved({});
          return;
        }
        const items = JSON.parse(localStorage.getItem(`collections__${user}`) || "[]");
        const coll = {};
        items.forEach((rec) => {
          if (rec.artworkId) coll[rec.artworkId] = { ...rec, isLocal: true };
        });
        setSaved(coll);
      } catch {
        setSaved({});
      }
    }
    getLocal();
    window.addEventListener("storage", getLocal); // Sync if changed in other tabs
    return () => window.removeEventListener("storage", getLocal);
  }, [user]);

  // --- SEARCH/FILTER STATE ---
  const [keyword, setKeyword] = useState("");
  const [style, setStyle] = useState("");
  const [color, setColor] = useState("");
  const [orientation, setOrientation] = useState("");
  const debounceTimer = useRef(null);

  // --- Filter options ---
  const styleOptions = [
    { value: "", label: "Any Style" },
    { value: "sketch", label: "Sketch" },
    { value: "painting", label: "Painting" },
    { value: "watercolor", label: "Watercolor" },
    { value: "photography", label: "Photography" },
    { value: "digital", label: "Digital Art" },
    { value: "drawing", label: "Drawing" },
    { value: "abstract", label: "Abstract" }
  ];
  // Common color values supported by both APIs (see docs)
  const colorOptions = [
    { value: "", label: "Any Color" },
    { value: "black", label: "Black" },
    { value: "white", label: "White" },
    { value: "gray", label: "Gray" },
    { value: "red", label: "Red" },
    { value: "orange", label: "Orange" },
    { value: "yellow", label: "Yellow" },
    { value: "green", label: "Green" },
    { value: "turquoise", label: "Turquoise" },
    { value: "blue", label: "Blue" },
    { value: "violet", label: "Violet" },
    { value: "pink", label: "Pink" },
    { value: "brown", label: "Brown" }
  ];
  // Supported by both APIs; note Pexels uses lowercase, Pixabay uses "horizontal"/"vertical"/"square"
  const orientationOptions = [
    { value: "", label: "Any Orientation" },
    { value: "landscape", label: "Landscape" },
    { value: "portrait", label: "Portrait" },
    { value: "square", label: "Square" }
  ];

  // API keys and endpoints
  const PEXELS_API_KEY = "o5vafzhrOvAK64hVAyrIH4LFL0zxxH3l1xpTiJ8otUfkzmQbWXNjaN1F";
  const PIXABAY_API_KEY = "50872548-89422cf3e7d17f61dfcb44fd6";
  const PEXELS_ENDPOINT = "https://api.pexels.com/v1/search";
  const PIXABAY_ENDPOINT = "https://pixabay.com/api/";

  // --- SEARCH/FILTERS HANDLER: Fetch on (debounced) change ---
  useEffect(() => {
    // Debounce to avoid spamming API as user types
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(() => {
      setLoading(true);
      setApiError(null);

      let userQuery = keyword && keyword.trim().length > 0 ? keyword.trim() : "art OR painting OR abstract OR gallery";
      // If style picked, append to query
      let q = userQuery;
      if (style) {
        q += " " + style;
      }

      if (source === "Pexels") {
        // Compose params: keyword, color, orientation => https://www.pexels.com/api/documentation/#photos-search
        let url = `${PEXELS_ENDPOINT}?query=${encodeURIComponent(q)}&per_page=18`;
        if (color) url += `&color=${encodeURIComponent(color)}`;
        if (orientation) url += `&orientation=${encodeURIComponent(orientation)}`;
        fetch(url, {
          headers: { Authorization: PEXELS_API_KEY },
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
        // Compose params: keyword, color, orientation => https://pixabay.com/api/docs/
        // Pixabay orientation: "all", "horizontal", "vertical", or "square"
        let orientationPixabay = "";
        if (orientation === "landscape") orientationPixabay = "horizontal";
        else if (orientation === "portrait") orientationPixabay = "vertical";
        else if (orientation === "square") orientationPixabay = "square";

        let url =
          `${PIXABAY_ENDPOINT}?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(q)}&image_type=photo&per_page=18&safesearch=true`;
        if (color) url += `&colors=${encodeURIComponent(color)}`;
        if (orientationPixabay) url += `&orientation=${orientationPixabay}`;
        fetch(url)
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
    }, 420); // ~420ms debounce

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
    // eslint-disable-next-line
  }, [keyword, style, color, orientation, source]);

  // --- UI: Source Tabs ---
  function SourceTabs() {
    return (
      <div className="art-feed-source-tabs" role="tablist" aria-label="Art Source Selector">
        <button
          className={`art-feed-source-tab${source === "Pexels" ? " active" : ""}`}
          tabIndex={0}
          role="tab"
          aria-selected={source === "Pexels"}
          onClick={() => setSource("Pexels")}
        >
          Pexels
        </button>
        <button
          className={`art-feed-source-tab${source === "Pixabay" ? " active" : ""}`}
          tabIndex={0}
          role="tab"
          aria-selected={source === "Pixabay"}
          onClick={() => setSource("Pixabay")}
        >
          Pixabay
        </button>
      </div>
    );
  }

  // --- UI: Search and filter controls, now with improved styles ---
  function SearchBarAndFilters() {
    // Move marginBottom from the old wrapper to outside for grid separation; remove gap/align here.
    return (
      <form
        className="art-feed-controls"
        onSubmit={e => e.preventDefault()}
        aria-label="Artwork search/filter controls"
      >
        <input
          type="text"
          value={keyword}
          autoComplete="off"
          aria-label="Search artworks"
          onChange={e => setKeyword(e.target.value)}
          placeholder='Search by keyword (e.g. "mandala", "cat drawing", "pencil sketch")'
          className="art-feed-search"
        />
        <select
          aria-label="Filter by art style"
          value={style}
          onChange={e => setStyle(e.target.value)}
          className="art-feed-select"
        >
          {styleOptions.map(opt =>
            <option value={opt.value} key={opt.value}>
              {opt.label}
            </option>
          )}
        </select>
        <select
          aria-label="Filter by color"
          value={color}
          onChange={e => setColor(e.target.value)}
          className="art-feed-select"
        >
          {colorOptions.map(opt =>
            <option value={opt.value} key={opt.value}>
              {opt.label}
            </option>
          )}
        </select>
        <select
          aria-label="Filter by orientation"
          value={orientation}
          onChange={e => setOrientation(e.target.value)}
          className="art-feed-select"
        >
          {orientationOptions.map(opt =>
            <option value={opt.value} key={opt.value}>
              {opt.label}
            </option>
          )}
        </select>
      </form>
    );
  }

  // --- Art grid unified rendering for both APIs ---
  function ArtGrid() {
    // Helpers for localStorage collections (per-username)
    function getCollArr() {
      if (!user) return [];
      try {
        return JSON.parse(localStorage.getItem(`collections__${user}`) || "[]");
      } catch {
        return [];
      }
    }
    function saveToLocal(art, isPexels) {
      if (!user) return;
      let item = {
        artworkId: "" + art.id,
        imageUrl: isPexels
          ? art.src && art.src.medium
            ? art.src.medium
            : art.src.original
          : art.webformatURL,
        link: isPexels ? art.url : art.pageURL,
        author: isPexels ? art.photographer : art.user,
        title: isPexels ? art.alt : (art.tags ? art.tags.split(",")[0] : "Artwork"),
        ts: Date.now(),
        isLocal: true
      };
      let arr = getCollArr();
      if (!arr.some(r => r.artworkId === item.artworkId)) {
        arr.unshift(item);
        localStorage.setItem(`collections__${user}`, JSON.stringify(arr));
        setSaved(s => ({ ...s, [item.artworkId]: item })); // Optimistic update
      }
    }
    function removeFromLocal(artworkId) {
      if (!user) return;
      let arr = getCollArr();
      arr = arr.filter(r => r.artworkId !== artworkId);
      localStorage.setItem(`collections__${user}`, JSON.stringify(arr));
      setSaved(s => {
        let copy = { ...s };
        delete copy[artworkId];
        return copy;
      });
    }

    // --- Save/unsave handling (username/localStorage only) ---
    async function handleSave(art, isPexels) {
      saveToLocal(art, isPexels);
    }
    async function handleUnsave(artworkId) {
      removeFromLocal(artworkId);
    }

    // Defensive: filter out undefined artworks and artworks missing required image info
    const filteredArtworks = Array.isArray(artworks)
      ? artworks.filter(art => {
          if (!art) return false;
          if (source === "Pexels") {
            // For Pexels, require art.src and some form of image
            return art.src?.medium || art.src?.original;
          } else if (source === "Pixabay") {
            // For Pixabay, require webformatURL
            return !!art.webformatURL;
          }
          return false;
        })
      : [];
    return (
      <div className="art-feed-grid">
        {filteredArtworks.length === 0 && (
          <div className="art-feed-empty">No artworks found.</div>
        )}
        {filteredArtworks.map((art, idx) => {
          // Defensive: check art and relevant fields are defined
          const isPexels = source === "Pexels";
          const imageUrl = isPexels
            ? art?.src?.medium
              ? art.src.medium
              : art?.src?.original || ""
            : art?.webformatURL || "";
          const artLink = isPexels
            ? art?.url || "#"
            : art?.pageURL || "#";
          const author = isPexels
            ? art?.photographer || ""
            : art?.user || "";
          const altText = isPexels
            ? art?.alt || "Artwork"
            : (art?.tags && typeof art.tags === "string"
                ? art.tags.split(",")[0]
                : "Artwork");
          const artworkId = art?.id ? "" + art.id : String(idx);
          const isSaved = saved[artworkId];

          return (
            <div className="art-feed-card" key={art?.id || art?.imageURL || idx}>
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
                  loading="lazy"
                  style={{ background: "#f6f2fe" }}
                />
              </a>
              <div className="art-feed-meta" style={{ justifyContent: "space-between" }}>
                <span className="art-feed-author">
                  {author ? `By ${author}` : ""}
                </span>
                {/* Save/Unsave Button with Icon */}
                <button
                  type="button"
                  tabIndex={0}
                  className="btn"
                  aria-label={
                    isSaved
                      ? "Remove from your collection"
                      : "Save to your collection"
                  }
                  style={{
                    background: "none",
                    border: "none",
                    padding: "4px 8px",
                    margin: 0,
                    color: isSaved ? "#ff89b6" : "#6A0DAD",
                    fontWeight: 700,
                    fontSize: "1.25em",
                    boxShadow: "none",
                    display: "flex",
                    alignItems: "center",
                    cursor: "pointer"
                  }}
                  onClick={() =>
                    isSaved
                      ? handleUnsave(artworkId)
                      : handleSave(art, isPexels)
                  }
                >
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 3
                    }}
                  >
                    {isSaved ? (
                      // Filled heart SVG
                      <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true" fill="#ff89b6">
                        <path d="M11 19s-6.22-3.61-8.25-7.31C1.1 9.82 1.08 7.63 2.62 6.13 4.1 4.7 6.7 4.65 8.26 6.09L11 8.66l2.74-2.57c1.56-1.44 4.16-1.39 5.64.04 1.53 1.5 1.51 3.69-.13 5.57C17.22 15.39 11 19 11 19z"/>
                      </svg>
                    ) : (
                      // Outlined heart SVG
                      <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true" fill="none" stroke="#6A0DAD" strokeWidth="2">
                        <path d="M11 19s-6.22-3.61-8.25-7.31C1.1 9.82 1.08 7.63 2.62 6.13 4.1 4.7 6.7 4.65 8.26 6.09L11 8.66l2.74-2.57c1.56-1.44 4.16-1.39 5.64.04 1.53 1.5 1.51 3.69-.13 5.57C17.22 15.39 11 19 11 19z"/>
                      </svg>
                    )}
                    <span style={{
                      fontSize: "1em",
                      color: isSaved ? "#ff89b6" : "#6A0DAD",
                      marginLeft: 4,
                      fontWeight: 600
                    }}>
                      {isSaved ? "Saved" : "Save"}
                    </span>
                  </span>
                </button>
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

      {/* Modern filter bar: Source selector and search/filters in flexbox wrapper at the very top */}
      <div
        className="art-feed-topbar"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 18,
          alignItems: "flex-end",
          justifyContent: "space-between",
          marginBottom: 16
        }}
      >
        <div style={{ minWidth: 195, flex: "0 1 auto" }}>
          <SourceTabs />
        </div>
        <div style={{ flex: "3 1 340px", width: "100%", maxWidth: 700 }}>
          <SearchBarAndFilters />
        </div>
      </div>
      {loading && (
        <div className="art-feed-loading">Loading artworks...</div>
      )}
      {apiError && <div className="art-feed-error">{apiError}</div>}
      {!loading && !apiError && <ArtGrid />}
    </section>
  );
}

export default ArtFeed;
