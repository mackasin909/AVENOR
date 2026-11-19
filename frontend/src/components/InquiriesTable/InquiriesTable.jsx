import Link from "next/link";
import styles from "@/styles/panel.module.scss";

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
});

// A table on laptops; one card per inquiry on tablets and phones
// (`data-label` gives each value its caption there, see .cardTable).
export default function InquiriesTable({ inquiries, showSender = false }) {
  if (inquiries.length === 0) {
    return <p className={styles.empty}>No inquiries yet.</p>;
  }

  return (
    <div className={styles.tableWrap}>
      <table className={`${styles.table} ${styles.cardTable}`}>
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
              <td data-label="#" className={styles.cellMuted}>{inquiry.id}</td>
              <td data-label="Date" className={styles.cellNowrap}>
                {dateFormat.format(inquiry.createdAt)}
              </td>
              <td data-label="Car" className={styles.cellTitle}>
                <Link href={`/car/${inquiry.car.id}`}>
                  {inquiry.car.year} {inquiry.car.brand} {inquiry.car.model}
                </Link>
              </td>
              <td data-label="Name">{inquiry.name}</td>
              <td data-label="Email" className={styles.cellBreak}>
                <a href={`mailto:${inquiry.email}`}>{inquiry.email}</a>
              </td>
              <td data-label="Message" className={styles.cellMessage}>
                {inquiry.message}
              </td>
              {showSender && (
                <td data-label="Account">{inquiry.user?.username ?? "Guest"}</td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
