import { RecurringEditor } from "@/features/recurring/editor";
export default async function RecurringPage({ params }: { params: Promise<{ id: string }> }) {
  return <RecurringEditor id={(await params).id} />;
}
