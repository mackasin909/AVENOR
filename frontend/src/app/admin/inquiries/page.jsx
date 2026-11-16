import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import InquiriesTable from "@/components/InquiriesTable/InquiriesTable";
import styles from "@/styles/panel.module.scss";

const LIMIT = 200;

export default async function AdminInquiriesPage() {
  if (!(await requireAdmin())) notFound();

  const inquiries = await prisma.inquiry.findMany({
    orderBy: { createdAt: "desc" },
    take: LIMIT,
    include: {
      car: { select: { id: true, year: true, brand: true, model: true } },
      user: { select: { username: true } },
    },
  });

  return (
    <>
      <div className={styles.head}>
        <h1 className={styles.title}>All inquiries</h1>
        <span className={styles.muted}>Latest {LIMIT}</span>
      </div>
      <InquiriesTable inquiries={inquiries} showSender />
    </>
  );
}
