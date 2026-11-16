import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import CarEditor from "@/components/CarEditor/CarEditor";
import styles from "@/styles/panel.module.scss";

export default async function AdminNewCarPage() {
  if (!(await requireAdmin())) notFound();

  return (
    <>
      <div className={styles.head}>
        <h1 className={styles.title}>Add a car</h1>
      </div>
      <CarEditor
        cancelHref="/admin/cars"
        note="Cars added by an admin are published as dealer listings right away."
      />
    </>
  );
}
