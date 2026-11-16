import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getCarById, getSimilarCars } from "@/lib/cars";
import CatalogCard from "@/components/CatalogCard/CatalogCard";
import RecentlyViewed from "@/components/RecentlyViewed/RecentlyViewed";
import RecordView from "@/components/RecentlyViewed/RecordView";
import styles from "./page.module.scss";
import CarImage from "@/components/CarImage/CarImage";
import CarForm from "@/components/CarForm/CarForm";

export default async function ProductPage({ params }) {
  const { id } = await params;

  const viewer = await getCurrentUser();
  const car = await getCarById(Number(id), viewer);

  if (!car) {
    notFound();
  }

  const isPublic = car.status === "approved";
  const similar = isPublic ? await getSimilarCars(car) : [];

  return (
    <div className={styles.carPage}>
      <div className="container">
        {!isPublic && (
          <p className={styles.notice} role="status">
            {car.status === "pending"
              ? "This listing is awaiting moderation and is not visible in the catalog yet."
              : `This listing was rejected${car.statusNote ? `: ${car.statusNote}` : "."}`}
          </p>
        )}
        <CarImage car={car}/>
        <div className={styles.infoMain}>
          <div className={styles.carInfo}>
            <div className={styles.infoBlock}>
              <div className={styles.block}>
                <h2><span>{car.year}</span> {car.name}</h2>
                <p>{car.location}</p>
              </div>
              <h4>$ {Number(car.price).toLocaleString("en-US")}</h4>
            </div>
            <div className={styles.infoBlock}>
              <div className={styles.stats}>
                <div>
                  <p>{car.year}</p>
                  <span>Year</span>
                </div>
                <div>
                  <p>{car.mileage} MI</p>
                  <span>Mileage</span>
                </div>
                <div>
                  <p>{car.engine}</p>
                  <span>Engine</span>
                </div>
                <div>
                  <p>{car.gearbox}</p>
                  <span>Gearbox</span>
                </div>
                <div>
                  <p>{car.fuelType}</p>
                  <span>Fuel Type</span>
                </div>
              </div>
            </div>
            <div className={styles.infoBlock}>
              <div className={styles.about}>
                <h4>About This Car</h4>
                <p>{car.description}</p>
              </div>
            </div>
          </div>
          {isPublic ? <CarForm carId={car.id} /> : null}
        </div>

        {similar.length > 0 && (
          <section className={styles.similar} aria-labelledby="similar-title">
            <h2 id="similar-title" className={styles.sectionTitle}>
              Similar cars
            </h2>
            <div className="grid">
              {similar.map((item) => (
                <CatalogCard
                  key={item.id}
                  id={item.id}
                  name={item.name}
                  year={item.year}
                  price={item.price}
                  location={item.location}
                  images={item.images}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      {isPublic && <RecordView carId={car.id} />}
      <RecentlyViewed excludeId={car.id} />
    </div>
  );
}