import { useState, useMemo } from "react";
import { ContactFilters } from "@/components/contacts/ContactFilters";
import { ContactsTable } from "@/components/contacts/ContactsTable";
import { ContactDetail } from "@/components/contacts/ContactDetail";
import { useContacts, type ContactFilters as CFilters } from "@/hooks/useContacts";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";

export default function Contacts() {
  const [filters, setFilters] = useState<CFilters>({
    search: "",
    type: "all",
    country: "all",
    riskStatus: "all",
  });
  const [detailId, setDetailId] = useState<string | null>(null);

  const { data: contacts = [], isLoading } = useContacts(filters);

  const selectedContact = useMemo(
    () => contacts.find((c) => c.id === detailId) ?? null,
    [contacts, detailId]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">Relaties</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {contacts.length} relaties
            {contacts.length > 0 && (
              <>
                {" · "}
                <span>{contacts.filter((c) => c.is_supplier).length} leveranciers</span>
                {" · "}
                <span>{contacts.filter((c) => c.is_customer).length} klanten</span>
              </>
            )}
          </p>
        </div>
      </div>

      <ContactFilters filters={filters} onChange={setFilters} />

      <ContactsTable
        contacts={contacts}
        isLoading={isLoading}
        onRowClick={(id) => setDetailId(id)}
        riskFilter={filters.riskStatus}
      />

      <ContactDetail
        contact={selectedContact}
        open={!!detailId}
        onClose={() => setDetailId(null)}
      />
    </div>
  );
}
