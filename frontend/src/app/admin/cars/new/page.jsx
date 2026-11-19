import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import CarEditor from "@/components/CarEditor/CarEditor";
import { blobUploadPrefix, getBlobMode } from "@/lib/uploads";
import styles from "@/styles/panel.module.scss";

export default async function AdminNewCarPage() {
  const admin = await requireAdmin();
  if (!admin) notFound();

  return (
    <>
      <div className={styles.head}>
        <h1 className={styles.title}>Add a car</h1>
      </div>
      <CarEditor
        blobMode={getBlobMode()}
        uploadPrefix={blobUploadPrefix(admin.id)}
        cancelHref="/admin/cars"
        note="Cars added by an admin are published as dealer listings right away."
      />
    </>
  );
}
