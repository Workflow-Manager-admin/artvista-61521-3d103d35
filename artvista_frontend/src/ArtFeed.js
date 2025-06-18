import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "./AuthContext";
import { firestore } from "./firebase";
import { collection, addDoc, deleteDoc, query, where, onSnapshot } from "firebase/firestore";
import { doc } from "firebase/firestore";

// PUBLIC_INTERFACE
/**
 * ArtFeed displays a responsive image grid with artworks from Pexels and Pixabay APIs.
 * Applies ArtVista's color theme for cohesive look.
 * Live keyword search & filter UI for style, color, orientation; fetches update as user types or changes filters.
 * Allows user to switch art source with tabs, and saving/unsaving artworks tied to user account.
 */
function ArtFeed() {
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [source, setSource] = useState("Pexels"); // ["Pexels"|"Pixabay"]
  const { user } = useAuth();
  const [saved, setSaved] = useState({});

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

  // Sync user's saved artworks (same as before)
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

  // --- UI: Source Tabs ---
  function SourceTabs() {
    return (
      <div style={{ display: "flex", gap: 10, marginBottom: "0.6rem" }}>
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

  // --- UI: Search and filter controls ---
  function SearchBarAndFilters() {
    return (
      <form
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 14,
          marginBottom: 16,
          alignItems: "center"
        }}
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
          style={{
            padding: "8px 14px",
            borderRadius: 14,
            border: "1px solid var(--secondary-color, #D8BFD8)",
            minWidth: 170,
            fontSize: "1.09rem",
            flex: "2"
          }}
        />
        <select
          aria-label="Filter by art style"
          value={style}
          onChange={e => setStyle(e.target.value)}
          style={{
            padding: "8px 10px",
            borderRadius: 12,
            border: "1px solid var(--secondary-color, #D8BFD8)",
            fontSize: "1.06rem",
            background: "#f6f2fe"
          }}
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
          style={{
            padding: "8px 10px",
            borderRadius: 12,
            border: "1px solid var(--secondary-color, #D8BFD8)",
            fontSize: "1.06rem",
            background: "#f6f2fe"
          }}
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
          style={{
            padding: "8px 10px",
            borderRadius: 12,
            border: "1px solid var(--secondary-color, #D8BFD8)",
            fontSize: "1.06rem",
            background: "#f6f2fe"
          }}
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
    async function handleSave(art, isPexels) {
      if (!user) {
        alert("Login to save artworks");
        return;
      }
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
      <SearchBarAndFilters />
      {loading && (
        <div className="art-feed-loading">Loading artworks...</div>
      )}
      {apiError && <div className="art-feed-error">{apiError}</div>}
      {!loading && !apiError && <ArtGrid />}
    </section>
  );
}

export default ArtFeed;
