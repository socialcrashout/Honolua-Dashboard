import { Routes, Route } from "react-router-dom";
import Nav from "./components/Nav.js";
import HeroStats from "./components/HeroStats.js";
import Modules from "./components/Modules.js";
import UpdatesGrid from "./components/honoluainfo.js";
import Footer from "./components/Footer.js";
import Team from "./pages/Team.js";
import Verify from "./pages/Verify.js";
import WorkspaceVerify from "./pages/WorkspaceVerify.js";
import Dashboard from "./pages/Dashboard.js";

function Home() {
  return (
    <>
      <HeroStats />
      <Modules />
      <UpdatesGrid />
    </>
  );
}

function SiteLayout({ children }) {
  return (
    <div className="min-h-screen">
      <Nav />
      {children}
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<SiteLayout><Home /></SiteLayout>} />
      <Route path="/team" element={<SiteLayout><Team /></SiteLayout>} />
      <Route path="/verify" element={<SiteLayout><Verify /></SiteLayout>} />
      <Route
        path="/workspace/verify"
        element={<SiteLayout><WorkspaceVerify /></SiteLayout>}
      />
      {/* Dashboard renders standalone — no shared Nav/Footer */}
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  );
}