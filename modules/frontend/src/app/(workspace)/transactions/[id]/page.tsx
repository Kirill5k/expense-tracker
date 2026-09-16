import { TransactionEditor } from "@/features/transactions/editor";
export default async function TransactionPage({ params }: { params: Promise<{ id: string }> }) {
  return <TransactionEditor id={(await params).id} />;
}
