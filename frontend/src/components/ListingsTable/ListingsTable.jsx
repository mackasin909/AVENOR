import ListingActions from "@/components/ListingActions/ListingActions";
import styles from "@/styles/panel.module.scss";

const dateFormat = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" });

// `cars` are rows from lib/cars toCar() plus optional `ownerName`
// and `inquiryCount`. A table on laptops; one card per car on tablets and
// phones (`data-label` gives each value its caption, see .cardTable).
export default function ListingsTable({ cars, isAdmin = false, editBase }) {
  return (
    <div className={styles.tableWrap}>
      <table className={`${styles.table} ${styles.cardTable}`}>
        <thead>
          <tr>
            <th>Photo</th>
            <th>Car</th>
            <th>Price</th>
            {isAdmin && <th>Seller</th>}
            <th>Status</th>
            <th>Inquiries</th>
            <th>Listed</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {cars.map((car) => (
            <tr key={car.id}>
              <td className={styles.cellPhoto}>
                {car.images[0] ? (
                  <img className={styles.thumb} src={car.images[0]} alt="" />
                ) : (
                  <div className={styles.thumb} />
                )}
              </td>
              <td className={styles.cellTitle}>
                <strong>{car.year} {car.name}</strong>
                <div className={styles.muted}>{car.location}</div>
              </td>
              <td data-label="Price" className={styles.cellNowrap}>
                $ {car.price.toLocaleString("en-US")}
              </td>
              {isAdmin && <td data-label="Seller">{car.ownerName ?? "Dealer"}</td>}
              <td data-label="Status">
                <span className={styles[`badge_${car.status}`]}>{car.status}</span>
                {car.status === "rejected" && car.statusNote && (
                  <div className={styles.muted}>{car.statusNote}</div>
                )}
              </td>
              <td data-label="Inquiries">{car.inquiryCount ?? 0}</td>
              <td data-label="Listed" className={styles.cellNowrap}>
                {car.createdAt ? dateFormat.format(new Date(car.createdAt)) : "—"}
              </td>
              <td className={styles.cellActions}>
                <ListingActions
                  car={{ id: car.id, name: car.name, status: car.status }}
                  editHref={`${editBase}/${car.id}/edit`}
                  isAdmin={isAdmin}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
