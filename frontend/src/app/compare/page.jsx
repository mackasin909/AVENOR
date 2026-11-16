import Link from "next/link";
import { getCarsByIds } from "@/lib/cars";
import { MAX_COMPARE } from "@/lib/compareLimits";
import CompareSync from "./CompareSync";
import CompareRemove from "./CompareRemove";
import panel from "@/styles/panel.module.scss";
import styles from "@/components/Compare/Compare.module.scss";

export const metadata = {
  title: "Compare cars — AVENOR",
};

const ROWS = [
  { label: "Price", value: (car) => `$ ${car.price.toLocaleString("en-US")}`, best: "min", key: "price" },
  { label: "Year", value: (car) => car.year, best: "max", key: "year" },
  { label: "Mileage", value: (car) => `${car.mileage.toLocaleString("en-US")} mi`, best: "min", key: "mileage" },
  { label: "Engine", value: (car) => car.engine },
  { label: "Gearbox", value: (car) => car.gearbox },
  { label: "Fuel type", value: (car) => car.fuelType },
  { label: "Location", value: (car) => car.location },
];

function parseIds(raw) {
  return String(raw ?? "")
    .split(",")
    .map(Number)
    .filter((id) => Number.isInteger(id) && id > 0)
    .slice(0, MAX_COMPARE);
}

function bestValue(cars, key, best) {
  if (!best || cars.length < 2) return null;
  const values = cars.map((car) => car[key]);
  return best === "min" ? Math.min(...values) : Math.max(...values);
}

export default async function ComparePage({ searchParams }) {
  const { ids: rawIds } = (await searchParams) ?? {};
  const hasParam = typeof rawIds === "string";
  const cars = await getCarsByIds(parseIds(rawIds));

  return (
    <div className={panel.page}>
      <div className="container">
        {/* Without ?ids= the page opens the visitor's saved selection. */}
        <CompareSync hasParam={hasParam} />

        <div className={panel.head}>
          <h1 className={panel.title}>Compare cars</h1>
        </div>

        {cars.length === 0 ? (
          <div className={panel.empty}>
            <p>Add cars to compare with the “Compare” button on a car page.</p>
            <br />
            <Link href="/#catalog" className={panel.button}>
              Browse catalog
            </Link>
          </div>
        ) : (
          <div className={panel.tableWrap}>
            <table className={`${panel.table} ${styles.table}`}>
              <thead>
                <tr>
                  <th />
                  {cars.map((car) => (
                    <th key={car.id}>
                      <div className={styles.carHead}>
                        {car.images[0] && <img src={car.images[0]} alt="" />}
                        <Link href={`/car/${car.id}`}>
                          {car.year} {car.name}
                        </Link>
                        <CompareRemove carId={car.id} />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row) => {
                  const best = bestValue(cars, row.key, row.best);
                  return (
                    <tr key={row.label}>
                      <th scope="row">{row.label}</th>
                      {cars.map((car) => (
                        <td
                          key={car.id}
                          className={best !== null && car[row.key] === best ? styles.best : undefined}
                        >
                          {row.value(car)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {cars.length > 0 && cars.length < MAX_COMPARE && (
          <>
            <br />
            <p className={panel.muted}>
              You can add {MAX_COMPARE - cars.length} more car
              {MAX_COMPARE - cars.length === 1 ? "" : "s"}.{" "}
              <Link href="/#catalog">Browse catalog</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
