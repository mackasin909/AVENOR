import CatalogCard from "@/components/CatalogCard/CatalogCard"
import styles from "./page.module.scss"
import { CARS } from "@/data/cars"

export default function CatalogPage() {
    return (
        <div className={styles.catalogPage}>
            <div className="container">
                <div className={styles.catalogTop}>
                    <h2 className={styles.title}>Catalog</h2>
                    <button className={styles.filter}>Filter</button>
                </div>

                <div className="grid">
                    {CARS.map((car) => {
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