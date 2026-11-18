import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getEditableCar } from "@/lib/cars";
import CarEditor from "@/components/CarEditor/CarEditor";
import { isBlobEnabled } from "@/lib/uploads";
import styles from "@/styles/panel.module.scss";

export default async function AdminEditCarPage({ params }) {
  const admin = await requireAdmin();
  if (!admin) notFound();

  const { id } = await params;
  const car = await getEditableCar(Number(id), admin);
  if (!car) notFound();

  return (
    <>
      <div className={styles.head}>
        <h1 className={styles.title}>Edit {car.year} {car.name}</h1>
      </div>
      <CarEditor car={car} cancelHref="/admin/cars" useBlob={isBlobEnabled()} />
    </>
  );
}
