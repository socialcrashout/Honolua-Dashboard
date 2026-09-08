import { useEffect, useState } from "react";
import DashboardOverview from "../components/DashboardOverview";

export default function Dashboard() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/workspace/status")
      .then((res) => res.json())
      .then((data) => {
        setStatus(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "linear-gradient(135deg, #FFFFFF 0%, #FFF8EF 20%, #FDEFE0 38%, #FFF6EC 58%, #FFFFFF 80%, #FFFFFF 100%), radial-gradient(85% 65% at 8% 100%, rgba(244,114,182,0.08), transparent 60%), radial-gradient(70% 50% at 95% 0%, rgba(244,185,66,0.10), transparent 60%)",
      }}
    >
      <div className="px-6 pt-10">
        <DashboardOverview />
      </div>
    </div>
  );
}