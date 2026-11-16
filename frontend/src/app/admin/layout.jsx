import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import AccountNav from "@/components/AccountNav/AccountNav";
import LoginPrompt from "@/components/LoginPrompt/LoginPrompt";
import styles from "@/styles/panel.module.scss";

export const metadata = {
  title: "Admin — AVENOR",
};

export default async function AdminLayout({ children }) {
  const user = await getCurrentUser();

  if (!user) {
    return <LoginPrompt title="Admin panel" text="Log in with an admin account" />;
  }

  // Hide the admin area entirely from regular users.
  if (user.role !== "admin") notFound();

  return (
    <div className={styles.page}>
      <div className="container">
        <AccountNav isAdmin />
        {children}
      </div>
    </div>
  );
}
