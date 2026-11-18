import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getEditableCar } from "@/lib/cars";
import CarEditor from "@/components/CarEditor/CarEditor";
import { isBlobEnabled } from "@/lib/uploads";
import LoginPrompt from "@/components/LoginPrompt/LoginPrompt";
import styles from "@/styles/panel.module.scss";

export default async function EditListingPage({ params }) {
  const user = await getCurrentUser();
  if (!user) return <LoginPrompt title="Edit listing" />;

  const { id } = await params;
  const car = await getEditableCar(Number(id), user);

  // Only the seller edits here (admins use /admin/cars).
  if (!car || car.ownerId !== user.id) notFound();

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.head}>
          <h1 className={styles.title}>Edit {car.year} {car.name}</h1>
        </div>
        <CarEditor
          useBlob={isBlobEnabled()}
          car={car}
          cancelHref="/my-listings"
          note="After you save, the listing goes back to review before it shows in the catalog again."
        />
      </div>
    </div>
  );
}
