import TriggerEditor from "@/components/TriggerEditor";

export default function Page({ params }) {
  return <TriggerEditor triggerId={params.id} />;
}