"use client";

import useSession from "@/context/SessionContext";
import styles from "@/styles/panel.module.scss";

export default function LoginPrompt({ title, text = "Log in to continue" }) {
  const { openSign } = useSession();

  return (
    <div className={styles.page}>
      <div className="container">
        {title && <h1 className={styles.title}>{title}</h1>}

        <div className={styles.empty}>
          <p>{text}</p>
          <br />
          <button type="button" className={styles.button} onClick={openSign}>
            Log in
          </button>
        </div>
      </div>
    </div>
  );
}
