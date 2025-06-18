import React, { useEffect, useState, useRef } from "react";

/**
 * DrawThisPhotoChallenge
 * - Fetches a random reference photo from Pexels or Pixabay.
 * - Let user upload their own art in response.
 * - Shows a smooth, modern side-by-side comparison.
 * - Re-fetches a new reference photo on "Try Another Photo".
 * - Uses a visual style matching the rest of ArtVista.
 */
// PUBLIC_INTERFACE
function DrawThisPhotoChallenge() {
  const PEXELS_API_KEY = "o5vafzhrOvAK64hVAyrIH4LFL0zxxH3l1xpTiJ8otUfkzmQbWXNjaN1F";
  const PIXABAY_API_KEY = "50872548-89422cf3e7d17f61dfcb44fd6";
  const PEXELS_ENDPOINT = "https://api.pexels.com/v1/search";
  const PIXABAY_ENDPOINT = "https://pixabay.com/api/";
  const [source, setSource] = useState(() => (Math.random() > 0.5 ? "Pexels" : "Pixabay"));
  const [referenceImg, setReferenceImg] = useState(null);
  const [refMeta, setRefMeta] = useState({});
  const [refLoading, setRefLoading] = useState(true);
  const [refErr, setRefErr] = useState(null);
  const [userArtUrl, setUserArtUrl] = useState(null);
  const [uploadErr, setUploadErr] = useState(null);
  const [showUploadSection, setShowUploadSection] = useState(false);
  const imgInputRef = useRef();

  // Fetch a new reference photo
  function fetchReferencePhoto() {
    setRefLoading(true);
    setRefErr(null);
    setReferenceImg(null);
    setRefMeta({});
    setShowUploadSection(false);
    setUserArtUrl(null);

    let q = "landscape|nature|still life|photo|painting|portrait";
    if (source === "Pexels") {
      const url = `${PEXELS_ENDPOINT}?query=${encodeURIComponent(q)}&per_page=32`;
      fetch(url, {
        headers: { Authorization: PEXELS_API_KEY }
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch reference photo (Pexels)");
          return res.json();
        })
        .then(data => {
          if (data.photos && data.photos.length > 0) {
            const idx = Math.floor(Math.random() * data.photos.length);
            const art = data.photos[idx];
            setReferenceImg(art.src && (art.src.large2x || art.src.large || art.src.original));
            setRefMeta({
              source: "Pexels",
              author: art.photographer,
              authorUrl: art.photographer_url,
              photoUrl: art.url,
              alt: art.alt || "Reference Photo"
            });
          } else throw new Error("No reference photo found (Pexels)");
          setRefLoading(false);
        })
        .catch(() => {
          // Fallback: try Pixabay
          setSource("Pixabay");
          setRefLoading(true);
          fetch(`${PIXABAY_ENDPOINT}?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(q)}&image_type=photo&per_page=32&safesearch=true`)
            .then(res => {
              if (!res.ok) throw new Error("Failed to fetch reference photo (Pixabay)");
              return res.json();
            })
            .then(data => {
              if (data.hits && data.hits.length > 0) {
                const idx = Math.floor(Math.random() * data.hits.length);
                const art = data.hits[idx];
                setReferenceImg(art.largeImageURL || art.webformatURL);
                setRefMeta({
                  source: "Pixabay",
                  author: art.user,
                  authorUrl: undefined,
                  photoUrl: art.pageURL,
                  alt: art.tags ? art.tags.split(",")[0] : "Reference Photo"
                });
              } else throw new Error("No reference photo found (Pixabay)");
              setRefLoading(false);
            })
            .catch(() => {
              setRefErr("No reference photo found from available sources.");
              setRefLoading(false);
            });
        });
    } else {
      // Start with Pixabay
      let url = `${PIXABAY_ENDPOINT}?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(q)}&image_type=photo&per_page=32&safesearch=true`;
      fetch(url)
        .then(res => {
          if (!res.ok) throw new Error("Failed to fetch reference photo (Pixabay)");
          return res.json();
        })
        .then(data => {
          if (data.hits && data.hits.length > 0) {
            const idx = Math.floor(Math.random() * data.hits.length);
            const art = data.hits[idx];
            setReferenceImg(art.largeImageURL || art.webformatURL);
            setRefMeta({
              source: "Pixabay",
              author: art.user,
              authorUrl: undefined,
              photoUrl: art.pageURL,
              alt: art.tags ? art.tags.split(",")[0] : "Reference Photo"
            });
          } else throw new Error("No reference photo found (Pixabay)");
          setRefLoading(false);
        })
        .catch(() => {
          // Fallback: try Pexels
          setSource("Pexels");
          setRefLoading(true);
          fetch(`${PEXELS_ENDPOINT}?query=${encodeURIComponent(q)}&per_page=32`, {
            headers: { Authorization: PEXELS_API_KEY }
          })
            .then(res => {
              if (!res.ok) throw new Error("Failed to fetch reference photo (Pexels)");
              return res.json();
            })
            .then(data => {
              if (data.photos && data.photos.length > 0) {
                const idx = Math.floor(Math.random() * data.photos.length);
                const art = data.photos[idx];
                setReferenceImg(art.src && (art.src.large2x || art.src.large || art.src.original));
                setRefMeta({
                  source: "Pexels",
                  author: art.photographer,
                  authorUrl: art.photographer_url,
                  photoUrl: art.url,
                  alt: art.alt || "Reference Photo"
                });
              } else throw new Error("No reference photo found (Pexels)");
              setRefLoading(false);
            })
            .catch(() => {
              setRefErr("No reference photo found from available sources.");
              setRefLoading(false);
            });
        });
    }
  }

  useEffect(() => {
    fetchReferencePhoto();
    // eslint-disable-next-line
  }, [source]);

  // Handle uploaded image
  function handleUploadChange(e) {
    setUploadErr(null);
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setUploadErr("Please upload an image file only.");
      return;
    }
    if (file.size > 6 * 1024 * 1024) {
      setUploadErr("Image file is too large (max 6MB).");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setUserArtUrl(ev.target.result);
      setShowUploadSection(true);
    };
    reader.readAsDataURL(file);
  }

  function handleUploadClick() {
    setUploadErr(null);
    imgInputRef.current && imgInputRef.current.click();
  }

  function handleRemoveUserArt() {
    setUserArtUrl(null);
    setShowUploadSection(false);
    setUploadErr(null);
    if (imgInputRef.current) imgInputRef.current.value = "";
  }

  // PUBLIC_INTERFACE
  return (
    <section
      className="draw-photo-challenge"
      style={{
        background: "linear-gradient(118deg, var(--primary-tint,#d4bee8) 80%, var(--accent-tint,#ffe2f1))",
        borderRadius: "24px",
        boxShadow: "0 6px 38px 0 rgba(141,95,197,0.15)",
        margin: "2.3rem 0 2.4rem 0",
        padding: "32px 10px 26px 10px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center"
      }}
      aria-label='"Draw This Photo" Challenge'
    >
      <h2
        className="draw-photo-title"
        style={{
          color: "var(--primary-color,#6A0DAD)",
          fontWeight: 800,
          fontSize: "1.95rem",
          margin: "0 0 0.62em 0",
          letterSpacing: "0.04em"
        }}
      >
        “Draw This Photo” Challenge
      </h2>
      <div
        className="draw-photo-desc"
        style={{ color: "var(--text-secondary)", fontWeight: 500, marginBottom: 19, fontSize: "1.18rem" }}
      >
        Get a random reference photo. Draw or paint your own version and upload it below to see a side-by-side comparison!
      </div>
      <div style={{ marginBottom: 17 }}>
        <button
          className="btn btn-large"
          type="button"
          style={{
            padding: "11px 26px",
            fontSize: "1.05rem",
            borderRadius: 40,
            background: "linear-gradient(95deg,var(--primary-tint,#d4bee8) 75%,var(--accent-tint,#ffe2f1))",
            color: "var(--primary-color,#6A0DAD)",
            marginRight: 11,
            marginBottom: 9
          }}
          onClick={fetchReferencePhoto}
          aria-label="Get a new random reference photo"
        >
          🎲 Try Another Photo
        </button>
        {!userArtUrl && (
          <button
            className="btn btn-large"
            type="button"
            style={{
              padding: "11px 26px",
              fontSize: "1.07rem",
              borderRadius: 40,
              background: "linear-gradient(95deg,var(--accent-tint,#ffe2f1),var(--primary-tint,#d4bee8))",
              color: "var(--primary-color,#6A0DAD)"
            }}
            onClick={handleUploadClick}
            aria-label="Upload your art in response to this reference photo"
          >
            ✏️ Upload Your Art
          </button>
        )}
        <input
          type="file"
          accept="image/*"
          ref={imgInputRef}
          style={{ display: "none" }}
          onChange={handleUploadChange}
        />
      </div>
      {refLoading && (
        <div style={{ color: "var(--accent-color)", fontSize: "1.14rem", margin: "2em 0" }}>
          Loading random photo...
        </div>
      )}
      {refErr && (
        <div style={{
          color: "#d8225c",
          background: "rgba(255,137,182,0.12)",
          fontWeight: 600,
          borderRadius: 14,
          padding: "11px 26px",
          margin: "1em 0"
        }}>
          {refErr}
        </div>
      )}
      {/* Side-by-side comparison */}
      {referenceImg && (
        <div
          className="draw-photo-compare"
          style={{
            display: "flex",
            flexDirection: "row",
            gap: "36px",
            justifyContent: "center",
            alignItems: "flex-start",
            marginTop: 18,
            marginBottom: 14,
            width: "100%",
            maxWidth: 880
          }}
        >
          {/* Reference image */}
          <div
            style={{
              background: "#fcfaff",
              borderRadius: 18,
              boxShadow: "0 3px 22px 0 rgba(141,95,197,0.04)",
              textAlign: "center",
              padding: "6px 12px 11px 12px",
              width: 315,
              maxWidth: "45vw"
            }}
          >
            <div style={{ fontWeight: 700, fontSize: "1.09em", color: "var(--primary-color)", margin: "7px 0" }}>
              Reference Photo
            </div>
            <a
              href={refMeta.photoUrl}
              target="_blank"
              rel="noopener noreferrer"
              tabIndex={0}
              title="View original photo"
            >
              <img
                src={referenceImg}
                alt={refMeta.alt || "Reference"}
                style={{
                  maxWidth: 290,
                  maxHeight: 320,
                  borderRadius: 13,
                  objectFit: "cover",
                  boxShadow: "0 2px 14px 0 rgba(76,52,117,0.08)",
                  marginBottom: 8,
                  background: "#f6f2fe"
                }}
              />
            </a>
            <div style={{ color: "var(--text-secondary)", fontSize: "0.99em", marginTop: 2 }}>
              {refMeta.author && (
                <>
                  By{" "}
                  {refMeta.authorUrl ? (
                    <a href={refMeta.authorUrl} style={{ color: "#8d5fc5", textDecoration: "underline" }} target="_blank" rel="noopener noreferrer">{refMeta.author}</a>
                  ) : (
                    <span>{refMeta.author}</span>
                  )}
                  {refMeta.source ? (
                    <span style={{ color: "#bba0d4", marginLeft: 5, fontSize: "0.95em" }}>({refMeta.source})</span>
                  ) : null}
                </>
              )}
            </div>
          </div>

          {/* Arrow/Plus visual */}
          <div
            aria-hidden="true"
            style={{
              margin: "0 0 0 0",
              alignSelf: userArtUrl ? "center" : "flex-end"
            }}
          >
            <svg width="50" height="55" viewBox="0 0 46 46" style={{ opacity: 0.23 }}>
              <path d="M2 23h42" stroke="#6A0DAD" strokeWidth="4" strokeLinecap="round" />
              <path d="M34 11l10 12-10 12" stroke="#6A0DAD" strokeWidth="3.3" fill="none" strokeLinecap="round" />
            </svg>
          </div>

          {/* User art or upload section */}
          <div
            style={{
              background: "#fffbfa",
              borderRadius: 18,
              boxShadow: "0 3px 22px 0 rgba(255,137,182,0.09)",
              textAlign: "center",
              padding: "6px 12px 11px 12px",
              width: 315,
              maxWidth: "45vw",
              minHeight: 100,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: userArtUrl ? "flex-start" : "center"
            }}
          >
            <div style={{ fontWeight: 700, fontSize: "1.09em", color: "var(--accent-color)", margin: "7px 0 7px 0" }}>
              Your Art
            </div>
            {!userArtUrl ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 9,
                  marginTop: 17,
                  marginBottom: 12
                }}
              >
                <button
                  className="btn"
                  type="button"
                  style={{
                    padding: "11px 26px",
                    fontSize: "1.03rem",
                    borderRadius: 40,
                    background: "linear-gradient(90deg,var(--accent-tint,#ffe2f1),var(--primary-tint,#d4bee8))",
                    color: "var(--primary-color,#6A0DAD)"
                  }}
                  onClick={handleUploadClick}
                  aria-label="Upload your finished art"
                >
                  Upload Your Art
                </button>
                <div style={{ color: "var(--text-secondary)", fontSize: "0.97em" }}>
                  Upload a photo or scan of your drawing, painting, or digital art inspired by the reference.
                </div>
                {uploadErr && (
                  <div style={{ color: "#d8225c", marginTop: 7 }}>
                    {uploadErr}
                  </div>
                )}
              </div>
            ) : (
              <>
                <img
                  src={userArtUrl}
                  alt="Your Art"
                  style={{
                    width: "100%",
                    maxWidth: 245,
                    maxHeight: 305,
                    borderRadius: 13,
                    objectFit: "contain",
                    background: "#fff5fc",
                    boxShadow: "0 1px 12px 0 rgba(255,137,182,0.04)",
                    marginBottom: 7
                  }}
                />
                <button
                  className="btn"
                  onClick={handleRemoveUserArt}
                  style={{
                    marginTop: 8,
                    padding: "7px 18px",
                    fontSize: "0.99em",
                    background: "#fad7ef",
                    color: "#c74a77",
                    borderRadius: 37
                  }}
                  aria-label="Remove and re-upload your art"
                  type="button"
                >
                  Remove &amp; Upload Again
                </button>
              </>
            )}
          </div>
        </div>
      )}
      <div style={{
        color: "var(--text-secondary)",
        fontSize: "0.98em",
        marginTop: 8,
        maxWidth: 480,
        textAlign: "center",
        fontStyle: "italic"
      }}>
        Challenge yourself: Observe the details, try to capture the mood or colors. <br />Upload your version, then share the comparison!
      </div>
    </section>
  );
}

export default DrawThisPhotoChallenge;
