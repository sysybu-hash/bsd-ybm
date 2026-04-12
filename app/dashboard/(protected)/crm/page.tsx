import CrmClient from "./CrmClient";
import { getCrmDataAction } from "@/app/actions/get-crm-data";

export default async function CrmPage() {
  const data = await getCrmDataAction();
  
  const contacts = data.success ? data.contacts : [];
  const projects = data.success ? data.projects : [];

  return (
    <CrmClient
      contacts={contacts as any}
      projects={projects as any}
      hasOrganization={true}
      organizations={[]}
      orgBilling={null}
    />
  );
}
