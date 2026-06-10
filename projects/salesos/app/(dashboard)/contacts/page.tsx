import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getContactsData } from "@/lib/queries";
import { PageHeader } from "@/components/page-header";
import { ContactsTable } from "@/components/contacts/contacts-table";

export default async function ContactsPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  const contacts = await getContactsData(user);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contacts"
        description={
          user.role === "REP"
            ? "People you're working deals with."
            : "Every account and contact across the team."
        }
      >
        <div className="text-muted-foreground text-sm">
          {contacts.length} contacts
        </div>
      </PageHeader>

      <ContactsTable contacts={contacts} />
    </div>
  );
}
