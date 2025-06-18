import React, { useEffect, useState } from 'react';
import './Sidebar.css';

// PUBLIC_INTERFACE
/**
 * Sidebar component fetches and displays art-related news from newsdata.io.
 * Features:
 * - Robust HTTP and JSON error handling.
 * - Explicit detection and messaging for CORS errors and network failures.
 * - Proactive user guidance in-app and in developer console if issues occur.
 * - Maintains clean, styled, accessible news card list layout.
 */
function Sidebar() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null); // For developer troubleshooting

  useEffect(() => {
    // --- ART NEWS FETCH LOGIC WITH FULL ERROR HANDLING + CORS DETECTION ---
    const API_KEY = 'pub_7009dcb5bea84ab48ddd0213f4cadc9f';
    const QUERY = 'art OR artwork OR gallery OR artist OR painting OR museum';
    // Removed invalid/unsupported CATEGORIES = 'arts'; // newsdata.io "arts" category
    const LANGUAGE = 'en';

    // Build request URL without unsupported category param, fallback to keyword search only
    // See https://newsdata.io/docs for allowed categories. As "arts" is not supported, use only q parameter.
    const newsUrl = `https://newsdata.io/api/1/news?apikey=${API_KEY}&q=${encodeURIComponent(QUERY)}&language=${LANGUAGE}`;

    setLoading(true);
    setApiError(null);
    setErrorDetails(null);

    // Helper for robust retry if fetch fails due to old param, try again without category param
    const fetchNews = (url, didRetry = false) =>
      fetch(url)
        .then(async (res) => {
          // HTTP-level error handling
          if (!res.ok) {
            let errorText = '';
            try {
              errorText = await res.text();
            } catch {
              errorText = '';
            }
            let errMsg = `[Sidebar] HTTP error: ${res.status} — ${errorText}`;
            // eslint-disable-next-line no-console
            console.error('[Sidebar] News fetch HTTP error:', errMsg);
            setErrorDetails(
              `HTTP Error Code: ${res.status}\nRaw response: ${errorText || '<none>'}`
            );
            // Check for 422 error mentioning category
            if (
              !didRetry &&
              res.status === 422 &&
              typeof errorText === 'string' &&
              errorText.match(/category.+does not exist/i)
            ) {
              // Retry with fallback: category param removed
              const fallbackUrl = `https://newsdata.io/api/1/news?apikey=${API_KEY}&q=${encodeURIComponent(QUERY)}&language=${LANGUAGE}`;
              // eslint-disable-next-line no-console
              console.warn("[Sidebar] Retrying news fetch without unsupported category.");
              return fetchNews(fallbackUrl, true);
            }
            throw new Error(errMsg);
          }
          // Try to parse the response as JSON; if not, treat as CORS or backend issue
          try {
            return await res.json();
          } catch (parseErr) {
            // Detect CORS or API limit response masquerading as text HTML
            let text = '';
            try {
              text = await res.text();
            } catch { /* no-op */ }
            let likelyCORS =
              typeof text === 'string' &&
              (
                text.includes('CORS') ||
                text.match(/Access-Control-Allow-Origin/i) ||
                text.match(/api key/i)
              );
            if (likelyCORS) {
              // eslint-disable-next-line no-console
              console.error('[Sidebar] Possible CORS error on fetch:', text);
              setErrorDetails(
                `Possible CORS error (see https://newsdata.io/docs for CORS support)\nRaw: ${text}`
              );
              throw new Error('CORS error: The API endpoint blocked browser access. Consider using a proxy server.');
            }
            // eslint-disable-next-line no-console
            console.error('[Sidebar] News fetch invalid JSON:', text);
            setErrorDetails(`Non-JSON (unexpected) response: ${text}`);
            throw new Error('API returned an unexpected/non-JSON response.');
          }
        })
        .then((data) => {
          // API-level (JSON) error handling
          if (
            data &&
            (data.status === "success" || typeof data.status === 'undefined') &&
            Array.isArray(data.results) &&
            data.results.length > 0
          ) {
            setNews(data.results.slice(0, 7));
            setApiError(null);
            setErrorDetails(null);
          } else {
            // Failures detected by API status/fields
            let errorMsg;
            if (data && data.status === "error" && data.message) {
              errorMsg = `Failed to load news: ${data.message}`;
              // eslint-disable-next-line no-console
              console.error('[Sidebar] News fetch API returned error:', data);
            } else if (data && Array.isArray(data.results) && data.results.length === 0) {
              errorMsg = "No recent news related to art at this time.";
            } else if (data && typeof data === "object" && data.message) {
              errorMsg = `Unexpected API response: ${data.message}`;
            } else {
              errorMsg = 'No news articles found, or API did not return results as expected.';
              // eslint-disable-next-line no-console
              console.error('[Sidebar] News fetch unknown/empty response:', data);
            }
            setApiError(errorMsg);
            setNews([]);
            setErrorDetails(
              `[Sidebar] API error. Raw response: ${JSON.stringify(data)}`
            );
          }
          setLoading(false);
        })
        .catch((err) => {
          // Network issues, CORS, or other generic errors
          // eslint-disable-next-line no-console
          if (err.message && err.message.includes('CORS')) {
            console.error('[Sidebar] News fetch CORS/network problem:', err);
          } else {
            console.error('[Sidebar] General News Fetch Error:', err);
          }
          setApiError(() =>
            err.message && err.message.includes("CORS")
              ? (
                <span>
                  News source unavailable due to CORS restriction.<br />
                  <span style={{ fontSize: '0.96em' }}>
                    This API endpoint may only be directly accessed from a server/backend—browsers are blocked.<br />
                    <b>To fix:</b> Use a serverless proxy (like <a href="https://corsproxy.io/" style={{ color: '#ff88d0', textDecoration: 'underline' }} target="_blank" rel="noopener noreferrer">CORS proxy</a>), or host your own proxy.
                  </span>
                </span>
              )
              : (
                <>
                  Failed to load news.<br />
                  <span style={{ fontSize: '0.97em', color: '#dde' }}>
                    {(err && err.message) || "Unknown error"}
                  </span>
                </>
              )
          );
          setErrorDetails(
            `[Sidebar] Fetch failed: ${err && err.message}\n` +
            'If this was a CORS error, check newsdata.io API browser access policy. ' +
            'Try a server/serverless proxy if needed. For dev use, see: https://newsdata.io/support'
          );
          setNews([]);
          setLoading(false);
        });

    // Start fetch (with proper fallback and removal of invalid category param)
    fetchNews(newsUrl);

    // End of useEffect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Developer troubleshooting details (rendered in UI for visibility)
  function ErrorDetails() {
    if (!errorDetails) return null;
    return (
      <pre
        style={{
          color: '#ff6d6d',
          background: 'rgba(30,5,5,0.13)',
          fontSize: '0.8em',
          margin: '8px 0 0 0',
          padding: '7px 12px',
          borderRadius: '4px',
          overflowX: 'auto',
        }}
        aria-label="Fetch error details"
      >
        {errorDetails}
      </pre>
    );
  }

  // UI rendering for sidebar news
  return (
    <aside className="sidebar-art-news" aria-label="Art News Sidebar">
      <h2 className="sidebar-title">Art News</h2>
      {loading && <div className="sidebar-loading">Loading latest art news...</div>}
      {apiError && (
        <div className="sidebar-error" role="alert">
          {apiError}
          <ErrorDetails />
        </div>
      )}
      {!loading && !apiError && (
        <ul className="sidebar-news-list">
          {news.length === 0 && (
            <li className="sidebar-no-news">
              No news available.
            </li>
          )}
          {news.map((article, idx) => (
            <li className="sidebar-news-card" key={article.link || article.url || idx}>
              <a
                className="sidebar-news-link"
                href={article.link || article.url}
                target="_blank"
                rel="noopener noreferrer"
                title={article.title}
              >
                <span className="sidebar-news-title">{article.title}</span>
              </a>
              <p className="sidebar-news-desc">
                {article.description
                  ? article.description.slice(0, 120) +
                    (article.description.length > 120 ? "..." : "")
                  : ''}
              </p>
              <span className="sidebar-news-source">
                {article.source_id ? `Source: ${article.source_id}` : ''}
              </span>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}

export default Sidebar;
