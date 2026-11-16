import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import InquiriesTable from "@/components/InquiriesTable/InquiriesTable";
import styles from "@/styles/panel.module.scss";

export default async function AdminPage() {
  if (!(await requireAdmin())) notFound();

  const [cars, pending, users, inquiries, latest] = await Promise.all([
    prisma.car.count(),
    prisma.car.count({ where: { status: "pending" } }),
    prisma.user.count(),
    prisma.inquiry.count(),
    prisma.inquiry.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        car: { select: { id: true, year: true, brand: true, model: true } },
        user: { select: { username: true } },
      },
    }),
  ]);

  return (
    <>
      <div className={styles.head}>
        <h1 className={styles.title}>Admin panel</h1>
        <Link href="/admin/cars/new" className={styles.button}>
          Add a car
        </Link>
      </div>

      <div className={styles.stats}>
        <Link href="/admin/cars" className={styles.stat}>
          <strong>{cars}</strong>
          <span className={styles.muted}>Cars</span>
        </Link>
        <Link href="/admin/cars?status=pending" className={styles.stat}>
          <strong>{pending}</strong>
          <span className={styles.muted}>Awaiting moderation</span>
        </Link>
        <Link href="/admin/inquiries" className={styles.stat}>
          <strong>{inquiries}</strong>
          <span className={styles.muted}>Inquiries</span>
        </Link>
        <div className={styles.stat}>
          <strong>{users}</strong>
          <span className={styles.muted}>Users</span>
        </div>
      </div>

      <h2 className={styles.subtitle}>Latest inquiries</h2>
      <InquiriesTable inquiries={latest} showSender />
    </>
  );
}
