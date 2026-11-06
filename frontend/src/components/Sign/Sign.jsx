"use client";

import { useState } from "react";
import styles from "./Sign.module.scss";

export default function Sign({ authState, setAuthState }) {
  if (!authState) return null;

  return <AuthDialog onClose={() => setAuthState(false)} />;
}

function AuthDialog({ onClose }) {
  const [isLogin, setIsLogin] = useState(false);

  function handleSubmit(event) {
    event.preventDefault();
  }

  return (
    <div
      id="sign-dialog"
      className={styles.dialog}
      role="dialog"
      aria-modal="true"
      aria-labelledby="sign-title"
    >
      <form
        className={styles.form}
        onSubmit={handleSubmit}
      >
        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>

        <h2 id="sign-title">
          {isLogin ? "Log In" : "Sign Up"}
        </h2>

        {!isLogin && (
          <div className={styles.formBlock}>
            <label htmlFor="sign-username">
              Username
            </label>

            <input
              id="sign-username"
              name="username"
              type="text"
              placeholder="username"
              autoComplete="username"
              required
            />
          </div>
        )}

        <div className={styles.formBlock}>
          <label htmlFor="sign-phone">
            Phone number
          </label>

          <input
            id="sign-phone"
            name="phone"
            type="tel"
            placeholder="XXX XXX XX XX"
            autoComplete="tel"
            required
          />
        </div>

        <div className={styles.formBlock}>
          <label htmlFor="sign-password">
            Password
          </label>

          <input
            id="sign-password"
            name="password"
            type="password"
            placeholder="password"
            autoComplete={
              isLogin ? "current-password" : "new-password"
            }
            required
          />
        </div>

        <button
          type="button"
          className={styles.formLink}
          onClick={() => setIsLogin((previous) => !previous)}
        >
          {isLogin
            ? "Don't have an account? Sign Up"
            : "Already have an account? Log In"}
        </button>

        <button
          type="submit"
          className={styles.formButton}
        >
          {isLogin ? "Log In" : "Sign Up"}
        </button>
      </form>
    </div>
  );
}