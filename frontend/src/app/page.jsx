import Catalog from "@/components/Catalog/Catalog";
import Welcome from "@/components/Welcome/Welcome";

export default function Home() {
  return (
    <div className="home">
      <Welcome />
      <Catalog />
    </div> 
  );
}
