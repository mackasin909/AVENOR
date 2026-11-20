"use client";

import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import { toast } from "react-toastify";
import { logIn, logOut, signUp } from "@/app/actions/auth";
import PhoneInput from "@/components/PhoneInput/PhoneInput";
import { formatPhone } from "@/lib/phone";
import styles from "./Sign.module.scss";

export default function Sign({ user, authState, onClose }) {
  if (!authState) return null;

  return user ? (
    <AccountDialog user={user} onClose={onClose} />
  ) : (
    <AuthDialog onClose={onClose} />
  );
}

function CloseButton({ onClose }) {
  return (
    <button
      type="button"
      className={styles.closeButton}
      onClick={onClose}
      aria-label="Close"
    >
      ×
    </button>
  );
}

function AuthDialog({ onClose }) {
  const [isLogin, setIsLogin] = useState(false);

  async function submit(previousState, formData) {
    const result = await (isLogin ? logIn : signUp)(previousState, formData);

    if (result.ok) {
      toast.success(isLogin ? "Welcome back!" : "Account created");
      onClose();
    }

    return result;
  }

  const [state, formAction, pending] = useActionState(submit, null);
  // After an error, keep the name and phone (React resets the form).
  const values = state?.values ?? {};

  return (
    <div
      id="sign-dialog"
      className={styles.dialog}
      role="dialog"
      aria-modal="true"
      aria-labelledby="sign-title"
    >
      <form className={styles.form} action={formAction}>
        <CloseButton onClose={onClose} />

        <h2 id="sign-title">
          {isLogin ? "Log In" : "Sign Up"}
        </h2>

        {!isLogin && (
          <div className={styles.formBlock}>
            <label htmlFor="sign-username">
              Username
            </label>

            <input
              key={`username-${values.username ?? ""}`}
              id="sign-username"
              name="username"
              defaultValue={values.username}
              type="text"
              placeholder="username"
              autoComplete="username"
              minLength={3}
              maxLength={32}
              required
            />
          </div>
        )}

        <div className={styles.formBlock}>
          <label htmlFor="sign-phone">
            Phone number
          </label>

          <PhoneInput
            key={`phone-${values.phone ?? ""}`}
            id="sign-phone"
            defaultValue={values.phone}
            guessDefault
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
            minLength={isLogin ? undefined : 8}
            required
          />
        </div>

        {state?.error && (
          <p className={styles.formError} role="alert">
            {state.error}
          </p>
        )}

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
          disabled={pending}
        >
          {pending ? "Please wait…" : isLogin ? "Log In" : "Sign Up"}
        </button>
      </form>
    </div>
  );
}

function AccountDialog({ user, onClose }) {
  const [pending, startTransition] = useTransition();

  function handleLogOut() {
    startTransition(async () => {
      await logOut();
      toast.info("Logged out");
      onClose();
    });
  }

  return (
    <div
      id="sign-dialog"
      className={styles.dialog}
      role="dialog"
      aria-modal="true"
      aria-labelledby="sign-title"
    >
      <div className={styles.form}>
        <CloseButton onClose={onClose} />

        <h2 id="sign-title">Account</h2>

        <div className={styles.formBlock}>
          <span className={styles.accountLabel}>Username</span>
          <p className={styles.accountValue}>{user.username}</p>
        </div>

        <div className={styles.formBlock}>
          <span className={styles.accountLabel}>Phone number</span>
          <p className={styles.accountValue}>{formatPhone(user.phone)}</p>
        </div>

        <nav className={styles.accountLinks} aria-label="Account">
          <Link href="/account" onClick={onClose}>My account</Link>
          <Link href="/my-listings" onClick={onClose}>My listings</Link>
          <Link href="/my-listings/new" onClick={onClose}>Sell a car</Link>
          {user.role === "admin" && (
            <Link href="/admin" onClick={onClose}>Admin panel</Link>
          )}
        </nav>

        <button
          type="button"
          className={styles.formButton}
          onClick={handleLogOut}
          disabled={pending}
        >
          {pending ? "Please wait…" : "Log Out"}
        </button>
      </div>
    </div>
  );
}
