import { redirect } from "next/navigation";

export default async function LegacyCrmPage() {
  redirect("/app/clients");
}
