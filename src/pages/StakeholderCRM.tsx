import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Plus, Search, Building2, Phone, Mail, FileText } from "lucide-react";
import { useContacts } from "@/hooks/useContacts";
import { pageTransition, staggerContainer, cardVariant } from "@/lib/animations";

export default function StakeholderCRM() {
  const defaultFilters = { search: "", type: "all" as const, country: "", riskStatus: "all" as const };
  const { data: contacts, isLoading: loading } = useContacts(defaultFilters);

  return (
    <motion.div variants={pageTransition} initial="initial" animate="animate" exit="exit" className="space-y-6">
      <motion.div variants={cardVariant} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Stakeholder CRM</h1>
          <p className="text-sm text-muted-foreground mt-1">Relatiebeheer, projecthistorie en contactbeheer</p>
        </div>
        <Button className="gap-1.5" disabled><Plus className="h-4 w-4" />Nieuw contact</Button>
      </motion.div>

      <motion.div variants={cardVariant}>
        <Card className="arcory-glass">
          <CardContent className="pt-5">
            <div className="flex gap-2">
              <Input placeholder="Zoek stakeholder..." className="flex-1" />
              <Button variant="outline"><Search className="h-4 w-4" /></Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Laden...</p>
      ) : (
        <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(contacts ?? []).slice(0, 12).map((c: any) => (
            <motion.div key={c.id} variants={cardVariant}>
              <Card className="arcory-glass hover:border-primary/30 transition-colors cursor-pointer">
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {c.is_customer && "Klant"}{c.is_customer && c.is_supplier && " • "}{c.is_supplier && "Leverancier"}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    {c.email && <div className="flex items-center gap-1.5"><Mail className="h-3 w-3" />{c.email}</div>}
                    {c.phone && <div className="flex items-center gap-1.5"><Phone className="h-3 w-3" />{c.phone}</div>}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
