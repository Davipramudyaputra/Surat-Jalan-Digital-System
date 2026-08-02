import { AppLayout } from "@/components/layout/AppLayout";
import { requireAdmin } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdmin().catch(() => null);

  if (!session) {
    redirect("/login");
  }

  return <AppLayout userName={session.user.username}>{children}</AppLayout>;
}
