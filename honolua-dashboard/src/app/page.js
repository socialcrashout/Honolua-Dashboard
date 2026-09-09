import Nav from "@/components/Nav.js";
import Footer from "@/components/Footer.js";
import HeroStats from "@/components/HeroStats.js";
import Modules from "@/components/Modules.js";
import UpdatesGrid from "@/components/honoluainfo.js";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Nav />
      <HeroStats />
      <Modules />
      <UpdatesGrid />
      <Footer />
    </div>
  );
}