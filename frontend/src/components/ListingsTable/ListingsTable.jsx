import ListingActions from "@/components/ListingActions/ListingActions";
import styles from "@/styles/panel.module.scss";

const dateFormat = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" });

// `cars` are rows from lib/cars toCar() plus optional `ownerName`
// and `inquiryCount`.
export default function ListingsTable({ cars, isAdmin = false, editBase }) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
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
              <td>
                {car.images[0] ? (
                  <img className={styles.thumb} src={car.images[0]} alt="" />
                ) : (
                  <div className={styles.thumb} />
                )}
              </td>
              <td>
                <strong>{car.year} {car.name}</strong>
                <div className={styles.muted}>{car.location}</div>
              </td>
              <td style={{ whiteSpace: "nowrap" }}>
                $ {car.price.toLocaleString("en-US")}
              </td>
              {isAdmin && <td>{car.ownerName ?? "Dealer"}</td>}
              <td>
                <span className={styles[`badge_${car.status}`]}>{car.status}</span>
                {car.status === "rejected" && car.statusNote && (
                  <div className={styles.muted}>{car.statusNote}</div>
                )}
              </td>
              <td>{car.inquiryCount ?? 0}</td>
              <td style={{ whiteSpace: "nowrap" }}>
                {car.createdAt ? dateFormat.format(new Date(car.createdAt)) : "—"}
              </td>
              <td>
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
