import { getCurrentUser } from "@/lib/auth";
import { getFavoriteCars } from "@/lib/cars";
import FavoritesList from "./FavoritesList";

export const metadata = {
  title: "Saved Listings — AVENOR",
};

export default async function FavoritesPage() {
  const user = await getCurrentUser();
  const cars = user ? await getFavoriteCars(user.id) : [];

  return <FavoritesList cars={cars} />;
}
