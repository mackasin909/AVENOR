import { getCurrentUser } from "@/lib/auth";
import CarEditor from "@/components/CarEditor/CarEditor";
import LoginPrompt from "@/components/LoginPrompt/LoginPrompt";
import styles from "@/styles/panel.module.scss";

export const metadata = {
  title: "Sell a car — AVENOR",
};

export default async function NewListingPage() {
  const user = await getCurrentUser();

  if (!user) {
    return <LoginPrompt title="Sell a car" text="Log in to list your car" />;
  }

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.head}>
          <h1 className={styles.title}>Sell a car</h1>
        </div>
        <CarEditor
          cancelHref="/my-listings"
          note="Your listing will appear in the catalog after our team approves it. Buyers will contact you on WhatsApp at your account phone number."
        />
      </div>
    </div>
  );
}
