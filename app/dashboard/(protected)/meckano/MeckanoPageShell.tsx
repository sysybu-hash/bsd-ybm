import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { hasMeckanoAccess } from "@/lib/meckano-access";
import MeckanoDashboard from "@/components/MeckanoDashboard";
import MeckanoAccessDenied from "@/components/MeckanoAccessDenied";

export default async function MeckanoPageShell() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  if (!hasMeckanoAccess(session.user.email)) {
    return <MeckanoAccessDenied />;
  }

  return <MeckanoDashboard />;
}
