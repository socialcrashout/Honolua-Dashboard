import TriggerEditor from "@/components/TriggerEditor";

export default async function Page({ params }) {
  const { id } = await params;
  return <TriggerEditor triggerId={id} />;
}