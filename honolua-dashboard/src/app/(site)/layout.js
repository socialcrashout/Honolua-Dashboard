import Nav from "@/components/Nav.js";
import Footer from "@/components/Footer.js";

export default function SiteLayout({ children }) {
  return (
    <div className="min-h-screen">
      <Nav />
      {children}
      <Footer />
    </div>
  );
}
