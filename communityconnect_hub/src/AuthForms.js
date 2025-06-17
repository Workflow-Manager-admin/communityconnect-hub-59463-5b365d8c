import React, { useState } from "react";

/**
 * Validate email with a simple regex pattern.
 */
function isValidEmail(email) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

/**
 * PUBLIC_INTERFACE
 * LoginForm: Handles user login with email and password and gives validation feedback.
 */
export function LoginForm({
  onLogin,
  loading,
  error,
  onSwitchToRegister
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState(false);
  const [localError, setLocalError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    setTouched(true);
    setLocalError("");
    if (!isValidEmail(email)) {
      setLocalError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setLocalError("Password must be at least 6 characters.");
      return;
    }
    onLogin({ email, password });
  }

  return (
    <form className="hub-modal" onSubmit={handleSubmit} noValidate>
      <h3>Login</h3>
      {error && <div style={{ color: "var(--primary)", marginBottom: 8 }}>{error}</div>}
      {localError && <div style={{ color: "var(--primary)", marginBottom: 8 }}>{localError}</div>}
      <input
        className="hub-input"
        type="email"
        autoComplete="username"
        aria-label="Email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        style={{ marginBottom: 10 }}
        required
      />
      <input
        className="hub-input"
        type="password"
        autoComplete="current-password"
        aria-label="Password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
        style={{ marginBottom: 16 }}
      />
      <button
        className="btn btn-accent btn-large"
        type="submit"
        style={{width: "100%", fontWeight: 700}}
        disabled={loading}
      >
        {loading ? "Logging in..." : "Login"}
      </button>
      <div style={{ textAlign: "center", marginTop: 15 }}>
        <span style={{ color: "var(--text-secondary)" }}>
          Don't have an account?{" "}
        </span>
        <button
          type="button"
          onClick={onSwitchToRegister}
          style={{
            background: "none",
            border: "none",
            color: "var(--accent)",
            cursor: "pointer",
            textDecoration: "underline",
            fontSize: "1em"
          }}
        >
          Register
        </button>
      </div>
    </form>
  );
}

/**
 * PUBLIC_INTERFACE
 * RegisterForm: Handles user registration with email/password and gives validation feedback.
 */
export function RegisterForm({
  onRegister,
  loading,
  error,
  onSwitchToLogin
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [localError, setLocalError] = useState("");
  const [touched, setTouched] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    setTouched(true);
    setLocalError("");
    if (!isValidEmail(email)) {
      setLocalError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setLocalError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setLocalError("Passwords do not match.");
      return;
    }
    onRegister({ email, password });
  }

  return (
    <form className="hub-modal" onSubmit={handleSubmit} noValidate>
      <h3>Register</h3>
      {error && <div style={{ color: "var(--primary)", marginBottom: 8 }}>{error}</div>}
      {localError && <div style={{ color: "var(--primary)", marginBottom: 8 }}>{localError}</div>}
      <input
        className="hub-input"
        type="email"
        aria-label="Email"
        placeholder="Email"
        value={email}
        autoComplete="username"
        onChange={e => setEmail(e.target.value)}
        style={{ marginBottom: 10 }}
        required
      />
      <input
        className="hub-input"
        type="password"
        aria-label="Password"
        placeholder="Password (min 6 chars)"
        value={password}
        autoComplete="new-password"
        onChange={e => setPassword(e.target.value)}
        required
        style={{ marginBottom: 10 }}
      />
      <input
        className="hub-input"
        type="password"
        aria-label="Confirm Password"
        placeholder="Confirm Password"
        value={confirm}
        autoComplete="new-password"
        onChange={e => setConfirm(e.target.value)}
        required
        style={{ marginBottom: 16 }}
      />
      <button
        className="btn btn-accent btn-large"
        type="submit"
        style={{width: "100%", fontWeight: 700}}
        disabled={loading}
      >
        {loading ? "Registering..." : "Register"}
      </button>
      <div style={{ textAlign: "center", marginTop: 15 }}>
        <span style={{ color: "var(--text-secondary)" }}>
          Already have an account?{" "}
        </span>
        <button
          type="button"
          onClick={onSwitchToLogin}
          style={{
            background: "none",
            border: "none",
            color: "var(--accent)",
            cursor: "pointer",
            textDecoration: "underline",
            fontSize: "1em"
          }}
        >
          Login
        </button>
      </div>
    </form>
  );
}
