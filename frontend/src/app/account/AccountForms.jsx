"use client";

import { useActionState, useTransition } from "react";
import {
  changePassword,
  deleteAccount,
  logOutEverywhere,
  updateProfile,
} from "@/app/actions/account";
import PhoneInput from "@/components/PhoneInput/PhoneInput";
import styles from "@/styles/panel.module.scss";

function Status({ state }) {
  if (!state) return null;

  return state.ok ? (
    <p className={styles.success} role="status">{state.message}</p>
  ) : (
    <p className={styles.error} role="alert">{state.error}</p>
  );
}

export function ProfileForm({ user }) {
  const [state, action, pending] = useActionState(updateProfile, null);
  // After an error, keep what was typed (React resets the form).
  const values = state?.ok === false && state.values ? state.values : null;
  const username = values?.username ?? user.username;
  const phone = values?.phone || user.phone;

  return (
    <section className={styles.card}>
      <h2 className={styles.subtitle}>Profile</h2>

      <form action={action} className={styles.form}>
        <label className={styles.field}>
          <span>Username</span>
          <input
            key={`username-${username}`}
            name="username"
            defaultValue={username}
            autoComplete="username"
            minLength={3}
            maxLength={32}
            required
          />
        </label>

        <div className={styles.field}>
          <label htmlFor="profile-phone">Phone number</label>
          <PhoneInput key={`phone-${phone}`} id="profile-phone" defaultValue={phone} />
        </div>

        <Status state={state} />

        <div className={styles.actions}>
          <button type="submit" className={styles.button} disabled={pending}>
            {pending ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </section>
  );
}

export function PasswordForm() {
  const [state, action, pending] = useActionState(changePassword, null);

  return (
    <section className={styles.card}>
      <h2 className={styles.subtitle}>Password</h2>

      <form action={action} className={styles.form}>
        <label className={styles.field}>
          <span>Current password</span>
          <input
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            required
          />
        </label>

        <label className={styles.field}>
          <span>New password</span>
          <input
            name="newPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>

        <label className={styles.field}>
          <span>Repeat new password</span>
          <input
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>

        <Status state={state} />

        <div className={styles.actions}>
          <button type="submit" className={styles.button} disabled={pending}>
            {pending ? "Saving…" : "Change password"}
          </button>
        </div>
      </form>
    </section>
  );
}

export function SessionsCard({ count }) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!window.confirm("Log out on all devices, including this one?")) return;
    startTransition(async () => {
      await logOutEverywhere();
    });
  }

  return (
    <section className={styles.card}>
      <h2 className={styles.subtitle}>Sessions</h2>
      <p className={styles.muted}>
        You are logged in on {count} device{count === 1 ? "" : "s"}.
      </p>
      <br />
      <button
        type="button"
        className={styles.buttonSecondary}
        onClick={handleClick}
        disabled={pending}
      >
        {pending ? "Logging out…" : "Log out on all devices"}
      </button>
    </section>
  );
}

export function DeleteAccountForm() {
  const [state, action, pending] = useActionState(async (previous, formData) => {
    if (!window.confirm("Delete your account, listings and saved cars? This cannot be undone.")) {
      return previous;
    }
    return deleteAccount(previous, formData);
  }, null);

  return (
    <section className={styles.dangerCard}>
      <h2 className={styles.subtitle}>Delete account</h2>
      <p className={styles.muted}>
        Your profile, listings, photos and saved cars will be removed for good.
      </p>
      <br />

      <form action={action} className={styles.form}>
        <label className={styles.field}>
          <span>Confirm with your password</span>
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </label>

        <Status state={state} />

        <div className={styles.actions}>
          <button type="submit" className={styles.buttonDanger} disabled={pending}>
            {pending ? "Deleting…" : "Delete account"}
          </button>
        </div>
      </form>
    </section>
  );
}
