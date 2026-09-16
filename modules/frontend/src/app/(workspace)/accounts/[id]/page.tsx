import { AccountEditorScreen } from "@/features/accounts/screens";
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AccountEditorScreen id={id} />;
}
