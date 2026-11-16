import Link from "next/link";
import styles from "@/styles/panel.module.scss";

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default function InquiriesTable({ inquiries, showSender = false }) {
  if (inquiries.length === 0) {
    return <p className={styles.empty}>No inquiries yet.</p>;
  }

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>#</th>
            <th>Date</th>
            <th>Car</th>
            <th>Name</th>
            <th>Email</th>
            <th>Message</th>
            {showSender && <th>Account</th>}
          </tr>
        </thead>
        <tbody>
          {inquiries.map((inquiry) => (
            <tr key={inquiry.id}>
              <td>{inquiry.id}</td>
              <td style={{ whiteSpace: "nowrap" }}>
                {dateFormat.format(inquiry.createdAt)}
              </td>
              <td>
                <Link href={`/car/${inquiry.car.id}`}>
                  {inquiry.car.year} {inquiry.car.brand} {inquiry.car.model}
                </Link>
              </td>
              <td>{inquiry.name}</td>
              <td>
                <a href={`mailto:${inquiry.email}`}>{inquiry.email}</a>
              </td>
              <td style={{ minWidth: 220, whiteSpace: "pre-wrap" }}>{inquiry.message}</td>
              {showSender && <td>{inquiry.user?.username ?? "Guest"}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
