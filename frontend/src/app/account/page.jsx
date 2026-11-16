import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AccountNav from "@/components/AccountNav/AccountNav";
import LoginPrompt from "@/components/LoginPrompt/LoginPrompt";
import styles from "@/styles/panel.module.scss";
import {
  DeleteAccountForm,
  PasswordForm,
  ProfileForm,
  SessionsCard,
} from "./AccountForms";

export const metadata = {
  title: "My account — AVENOR",
};

export default async function AccountPage() {
  const user = await getCurrentUser();

  if (!user) {
    return <LoginPrompt title="My account" text="Log in to manage your account" />;
  }

  const sessionCount = await prisma.session.count({
    where: { userId: user.id, expiresAt: { gt: new Date() } },
  });

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.head}>
          <h1 className={styles.title}>My account</h1>
        </div>

        <AccountNav isAdmin={user.role === "admin"} />

        <div className={styles.grid2}>
          <ProfileForm user={user} />
          <PasswordForm />
          <SessionsCard count={sessionCount} />
          <DeleteAccountForm />
        </div>
      </div>
    </div>
  );
}
