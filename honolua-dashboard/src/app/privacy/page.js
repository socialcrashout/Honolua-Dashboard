import Nav from "@/components/Nav.js";
import Footer from "@/components/Footer.js";
import PrivacyPolicy from "@/components/PrivacyPolicy";

export const metadata = {
  title: "Privacy Policy — Honolua",
  description: "How Honolua handles community and staff information.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen">
      <Nav />
      <PrivacyPolicy />
      <Footer />
    </div>
  );
}