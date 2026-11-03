import { notFound } from "next/navigation";
import { CARS } from "@/data/cars";
import styles from "./page.module.scss";
import CarImage from "@/components/CarImage/CarImage";
import CarForm from "@/components/CarForm/CarForm";

export default async function ProductPage({ params }) {
  const { id } = await params;

  const car = CARS.find((item) => item.id === Number(id));

  if (!car) {
    notFound();
  }

  return (
    <div className={styles.carPage}>
      <div className="container">
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
                  <p>{car.milage} MI</p>
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
          <CarForm />
        </div>
      </div>
    </div>
  );
}