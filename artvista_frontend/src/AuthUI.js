import React, { useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInWithPopup,
  GoogleAuthProvider
} from "firebase/auth";
import { useAuth } from "./AuthContext";

// PUBLIC_INTERFACE
/**
 * Render login/logout/signup UI and expose auth actions.
 * - Shows login/sign up form if not logged in
 * - Shows logout button and user avatar/email if logged in
 */
function AuthUI() {
  const { user, loading, auth } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");

  // Switch between login/signup
  const handleAuthAction = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (isSignup) {
        await createUserWithEmailAndPassword(auth, email, pw);
      } else {
        await signInWithEmailAndPassword(auth, email, pw);
      }
    } catch (err) {
      setError(err.message || "Auth error");
    }
  };

  const handleGoogle = async () => {
    setError("");
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (err) {
      setError(err.message || "Google sign-in error");
    }
  };

  if (loading) {
    return <span style={{ color: "#6A0DAD" }}>Loading auth...</span>;
  }

  if (user) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {user.photoURL && (
          <img
            src={user.photoURL}
            alt="profile"
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              border: "1.5px solid #6A0DAD",
              marginRight: 5,
            }}
          />
        )}
        <span
          style={{
            color: "#6A0DAD",
            fontWeight: 600,
            fontSize: "1.03em",
            marginRight: 8,
          }}
        >
          {user.displayName || user.email}
        </span>
        <button
          className="btn"
          style={{ padding: "6px 16px", fontSize: "1em" }}
          onClick={() => signOut(auth)}
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleAuthAction}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        margin: 0,
      }}
      aria-label={isSignup ? "Sign up form" : "Login form"}
    >
      <input
        type="email"
        placeholder="Email"
        required
        autoFocus
        style={{
          padding: "7px 10px",
          borderRadius: 7,
          border: "1px solid #aaa",
          minWidth: 120,
        }}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        required
        style={{
          padding: "7px 10px",
          borderRadius: 7,
          border: "1px solid #aaa",
          minWidth: 90,
        }}
        value={pw}
        onChange={(e) => setPw(e.target.value)}
      />
      <button
        className="btn"
        style={{ padding: "7px 18px", fontSize: "1em" }}
        type="submit"
      >
        {isSignup ? "Sign Up" : "Login"}
      </button>
      <button
        type="button"
        className="btn"
        style={{
          background: "#fff",
          color: "#6A0DAD",
          border: "1px solid #d4bee8",
          padding: "7px 14px",
        }}
        onClick={handleGoogle}
      >
        Google
      </button>
      <button
        type="button"
        style={{
          background: "none",
          border: "none",
          color: "#8d5fc5",
          textDecoration: "underline",
          marginLeft: 8,
          cursor: "pointer"
        }}
        onClick={() => setIsSignup((v) => !v)}
        aria-label={isSignup ? "Switch to login" : "Switch to sign up"}
      >
        {isSignup ? "Have an account? Login" : "New? Sign up"}
      </button>
      {error && (
        <span style={{ color: "#d8225c", fontSize: "0.94em", marginLeft: 4 }}>
          {error}
        </span>
      )}
    </form>
  );
}

export default AuthUI;
