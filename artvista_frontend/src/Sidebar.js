import React, { useEffect, useState } from 'react';
import './Sidebar.css';

// PUBLIC_INTERFACE
function Sidebar() {
  /**
   * Sidebar component fetches and displays art-related news.
   * News are fetched from newsdata.io public API and shown as a list of cards
   * Each card: title, snippet/description, and a link to the article.
   */
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  useEffect(() => {
    /**
     * Fetch the latest art-related news from newsdata.io.
     * - Correct API use: GET https://newsdata.io/api/1/news
     * - Required params: apikey, q (search), category, language
     * - Handles error states: HTTP/network errors, invalid data, no results.
     */
    const apiKey = 'pub_7009dcb5bea84ab48ddd0213f4cadc9f';
    const query = 'art OR artwork OR gallery OR artist OR painting OR museum';
    const url = `https://newsdata.io/api/1/news?apikey=${apiKey}&q=${encodeURIComponent(
      query
    )}&language=en&category=arts`;

    setLoading(true);
    setApiError(null);

    fetch(url)
      .then(res => {
        if (!res.ok) {
          throw new Error(`Network response was not ok (status ${res.status})`);
        }
        return res.json();
      })
      .then(data => {
        if (data && Array.isArray(data.results) && data.results.length > 0) {
          setNews(data.results.slice(0, 7));
        } else {
          setNews([]);
          if (data && data.status === "error" && data.message) {
            setApiError(`Failed to load news: ${data.message}`);
          } else {
            setApiError('No news articles found.');
          }
        }
        setLoading(false);
      })
      .catch(err => {
        setApiError('Failed to load news.');
        setNews([]);
        setLoading(false);
      });
  }, []);

  return (
    <aside className="sidebar-art-news" aria-label="Art News Sidebar">
      <h2 className="sidebar-title">Art News</h2>
      {loading && <div className="sidebar-loading">Loading...</div>}
      {apiError && <div className="sidebar-error">{apiError}</div>}
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
