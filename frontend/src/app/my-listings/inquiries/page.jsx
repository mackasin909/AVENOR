import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AccountNav from "@/components/AccountNav/AccountNav";
import InquiriesTable from "@/components/InquiriesTable/InquiriesTable";
import LoginPrompt from "@/components/LoginPrompt/LoginPrompt";
import styles from "@/styles/panel.module.scss";

export const metadata = {
  title: "Inquiries — AVENOR",
};

export default async function MyInquiriesPage() {
  const user = await getCurrentUser();
  if (!user) return <LoginPrompt title="Inquiries" />;

  const inquiries = await prisma.inquiry.findMany({
    where: { car: { ownerId: user.id } },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      car: { select: { id: true, year: true, brand: true, model: true } },
    },
  });

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.head}>
          <h1 className={styles.title}>Inquiries</h1>
        </div>

        <AccountNav isAdmin={user.role === "admin"} />

        <p className={styles.muted}>Messages buyers sent about your listings.</p>
        <br />

        <InquiriesTable inquiries={inquiries} />
      </div>
    </div>
  );
}
