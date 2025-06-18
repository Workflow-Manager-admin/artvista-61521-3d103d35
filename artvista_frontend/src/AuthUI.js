import React, { useState } from "react";
import { useAuth } from "./AuthContext";

// PUBLIC_INTERFACE
/**
 * Render username login/logout UI and expose actions.
 * - Shows username prompt if not logged in
 * - Shows logout button and username if logged in
 */
function AuthUI() {
  const { user, loading, login, logout } = useAuth();
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

  if (loading) {
    return <span style={{ color: "#6A0DAD" }}>Loading auth...</span>;
  }

  if (user) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span
          style={{
            color: "#6A0DAD",
            fontWeight: 600,
            fontSize: "1.03em",
            marginRight: 8,
          }}
        >
          {user}
        </span>
        <button
          className="btn"
          style={{ padding: "6px 16px", fontSize: "1em" }}
          onClick={logout}
        >
          Logout
        </button>
      </div>
    );
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = (input || "").trim();
    if (!trimmed || trimmed.length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }
    if (/[^a-zA-Z0-9_\-]/.test(trimmed)) {
      setError("Username can only contain letters, numbers, _ or -");
      return;
    }
    setError("");
    login(trimmed);
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        margin: 0,
        minWidth: 240,
        width: "100%",
      }}
      aria-label="Username login form"
    >
      <input
        type="text"
        placeholder="Enter a username"
        required
        autoFocus
        value={input}
        minLength={3}
        maxLength={18}
        autoComplete="off"
        style={{
          padding: "10px 16px",
          borderRadius: 10,
          border: "1px solid #aaa",
          fontSize: "1.10em",
          width: "100%",
          maxWidth: 340,
        }}
        onChange={(e) => {
          setInput(e.target.value);
          setError("");
        }}
        aria-label="Choose a username"
      />
      <button
        className="btn btn-large"
        style={{ padding: "11px 28px", fontSize: "1.06em" }}
        type="submit"
      >
        Start Exploring
      </button>
      {error && (
        <span style={{ color: "#d8225c", fontSize: "0.97em" }}>
          {error}
        </span>
      )}
      <div style={{ color: "var(--text-secondary)", fontSize: "0.98em", marginTop: 1 }}>
        No account or password required!
      </div>
    </form>
  );
}

export default AuthUI;
