import CatalogCard from "../CatalogCard/CatalogCard"
import styles from "./Catalog.module.scss"
import { CARS } from "@/data/cars"

export default function Catalog() {
    const bestOffers = CARS.slice(0, 3)
    const mostPopular = CARS.slice(3, 6)
    const newest = CARS.slice(6, 9)

    return (
        <div className={styles.catalog}>
            <div className="container">
                <h1 className={styles.title}>Best offers</h1>

                <div className={`grid ${styles.catalogContainer}`}>
                    {bestOffers.map((car) => {
                        return (
                            <CatalogCard
                                key={car.id}
                                id={car.id}
                                year={car.year}
                                location={car.location}
                                images={car.images}
                                name={car.name}
                                price={car.price}
                            />
                        )
                    })}
                </div>

                <h1 className={styles.title}>Most popular</h1>

                <div className={`grid ${styles.catalogContainer}`}>
                    {mostPopular.map((car) => {
                        return (
                            <CatalogCard
                                key={car.id}
                                id={car.id}
                                year={car.year}
                                location={car.location}
                                images={car.images}
                                name={car.name}
                                price={car.price}
                            />
                        )
                    })}
                </div>

                <h1 className={styles.title}>The newest</h1>

                <div className={`grid ${styles.catalogContainer}`}>
                    {newest.map((car) => {
                        return (
                            <CatalogCard
                                key={car.id}
                                id={car.id}
                                year={car.year}
                                location={car.location}
                                images={car.images}
                                name={car.name}
                                price={car.price}
                            />
                        )
                    })}
                </div>
            </div>
        </div>
    )
}