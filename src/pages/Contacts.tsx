import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ContactFilters } from "@/components/contacts/ContactFilters";
import { ContactsTable } from "@/components/contacts/ContactsTable";
import { ContactDetail } from "@/components/contacts/ContactDetail";
import { useContacts, type ContactFilters as CFilters } from "@/hooks/useContacts";
import { Users } from "lucide-react";
import { fadeInUp, staggerContainer } from "@/lib/animations";

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
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-4 max-w-[1400px]"
    >
      <motion.div variants={fadeInUp} className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-white/[0.05] flex items-center justify-center text-primary/60">
              <Users className="h-4 w-4" />
            </div>
            <h1 className="text-heading text-foreground">Relaties</h1>
          </div>
          <p className="mt-1 text-[13px] text-muted-foreground/60">
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
      </motion.div>

      <motion.div variants={fadeInUp}>
        <ContactFilters filters={filters} onChange={setFilters} />
      </motion.div>

      <motion.div variants={fadeInUp}>
        <ContactsTable
          contacts={contacts}
          isLoading={isLoading}
          onRowClick={(id) => setDetailId(id)}
          riskFilter={filters.riskStatus}
        />
      </motion.div>

      <ContactDetail
        contact={selectedContact}
        open={!!detailId}
        onClose={() => setDetailId(null)}
      />
    </motion.div>
  );
}
