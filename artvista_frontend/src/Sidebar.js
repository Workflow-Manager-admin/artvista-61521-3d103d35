import React, { useEffect, useState } from 'react';
import './Sidebar.css';

// PUBLIC_INTERFACE
function Sidebar() {
  /**
   * Sidebar component fetches and displays art-related news.
   * News are fetched from newsdata.io public API and shown as a list of cards
   * Each card: title, snippet/description, and a link to the article.
   * Fetch logic is robust and includes detailed logging and error handling.
   */

  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null); // For troubleshooting details

  useEffect(() => {
    /**
     * Fetch the latest art-related news from newsdata.io.
     * - Endpoint: https://newsdata.io/api/1/news
     * - Required params: apikey, q (search), category, language
     * - Handles error states, CORS, and network issues.
     * - Console logs details useful for debugging.
     *
     * NOTE: If you see a CORS error, newsdata.io may not allow raw browser requests for your API key (you may need a proxy server).
     * See: https://newsdata.io/docs for restrictions.
     */
    const apiKey = 'pub_7009dcb5bea84ab48ddd0213f4cadc9f';
    const query = 'art OR artwork OR gallery OR artist OR painting OR museum';
    const url = `https://newsdata.io/api/1/news?apikey=${apiKey}&q=${encodeURIComponent(
      query
    )}&language=en&category=arts`;

    setLoading(true);
    setApiError(null);
    setErrorDetails(null);

    fetch(url)
      .then(async res => {
        if (!res.ok) {
          // Special CORS error codes do not always produce a res here!
          let text = await res.text().catch(() => '');
          let errorMsg = `Network response was not ok (status ${res.status}). Response text: ${text}`;
          // Log full error for developer
          // eslint-disable-next-line no-console
          console.error('[Sidebar] News fetch error:', errorMsg);
          setErrorDetails(errorMsg);
          throw new Error(errorMsg);
        }
        return res.json();
      })
      .then(data => {
        // newsdata.io metadata: {status: "success"|"error"}; results: [articles]
        if (
          data &&
          (data.status === "success" || data.status === undefined) &&
          Array.isArray(data.results) &&
          data.results.length > 0
        ) {
          setNews(data.results.slice(0, 7));
          setErrorDetails(null);
        } else {
          setNews([]);
          let errorMsg;
          if (data && data.status === "error" && data.message) {
            errorMsg = `Failed to load news: ${data.message}`;
          } else if (typeof data === 'string' && data.includes("CORS")) {
            // Custom catch for CORS error in string response
            errorMsg = 'CORS error: newsdata.io rejected this request from frontend (browser). You may need a server proxy.';
          } else {
            errorMsg = 'No news articles found.';
          }
          setApiError(errorMsg);
          setErrorDetails(
            `[Sidebar] API error. Raw response: ${JSON.stringify(data)}`
          );
          // eslint-disable-next-line no-console
          console.error('[Sidebar] News fetch returned error state. Data:', data);
        }
        setLoading(false);
      })
      .catch(err => {
        // developer-mode log always for fetch errors
        // eslint-disable-next-line no-console
        console.error('[Sidebar] General News Fetch Error:', err);
        setApiError('Failed to load news.');
        setErrorDetails(
          `[Sidebar] Fetch failed: ${err.message}.\n` +
          'If this was a CORS error, check newsdata.io API browser access policy. ' +
          'Try a serverless proxy if needed.'
        );
        setNews([]);
        setLoading(false);
      });
  }, []);

  // Render error details for troubleshooting (dev mode UX)
  function ErrorDetails() {
    if (!errorDetails) return null;
    return (
      <pre
        style={{
          color: '#ff6d6d',
          background: 'rgba(30,5,5,0.13)',
          fontSize: '0.81rem',
          margin: '8px 0 0 0',
          padding: '7px 12px',
          borderRadius: '4px',
          overflowX: 'auto'
        }}
        aria-label="Fetch error details"
      >
        {errorDetails}
      </pre>
    );
  }

  return (
    <aside className="sidebar-art-news" aria-label="Art News Sidebar">
      <h2 className="sidebar-title">Art News</h2>
      {loading && <div className="sidebar-loading">Loading...</div>}
      {apiError && (
        <div className="sidebar-error">
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
          {news.length > 0 &&
            news.map((article, idx) => (
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
                    ? article.description.slice(0, 120) + (article.description.length > 120 ? '...' : '')
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
