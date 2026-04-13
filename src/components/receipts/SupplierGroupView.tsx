import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Building2, ChevronRight, Receipt, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cardVariant } from "@/lib/animations";
import type { Database } from "@/integrations/supabase/types";
import { SupplierReceiptsSheet } from "./SupplierReceiptsSheet";

type Document = Database["public"]["Tables"]["documents"]["Row"];

interface SupplierGroup {
  name: string;
  documents: Document[];
  totalAmount: number;
  lastDate: string | null;
  contactId: string | null;
}

interface Props {
  documents: Document[];
  onSelectDoc: (id: string) => void;
  orgId: string | undefined;
}

export function SupplierGroupView({ documents, onSelectDoc, orgId }: Props) {
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierGroup | null>(null);

  const groups = useMemo(() => {
    const map = new Map<string, SupplierGroup>();

    for (const doc of documents) {
      const supplierName = doc.extracted_supplier_name?.trim();
      if (!supplierName) continue;

      const key = supplierName.toLowerCase();
      const existing = map.get(key);

      if (existing) {
        existing.documents.push(doc);
        existing.totalAmount += Number(doc.extracted_amount ?? 0);
        if (doc.extracted_date && (!existing.lastDate || doc.extracted_date > existing.lastDate)) {
          existing.lastDate = doc.extracted_date;
        }
        if (doc.contact_id && !existing.contactId) {
          existing.contactId = doc.contact_id;
        }
      } else {
        map.set(key, {
          name: supplierName,
          documents: [doc],
          totalAmount: Number(doc.extracted_amount ?? 0),
          lastDate: doc.extracted_date ?? null,
          contactId: doc.contact_id ?? null,
        });
      }
    }

    return Array.from(map.values()).sort((a, b) => b.documents.length - a.documents.length);
  }, [documents]);

  const ungrouped = useMemo(
    () => documents.filter((d) => !d.extracted_supplier_name?.trim()),
    [documents]
  );

  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Building2 className="h-12 w-12 text-muted-foreground/40 mb-3" />
        <p className="text-sm font-medium text-foreground">Geen leveranciers herkend</p>
        <p className="text-xs text-muted-foreground mt-1">
          Upload bonnen — de AI herkent automatisch leveranciersnamen
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {groups.map((group) => (
          <motion.div key={group.name} variants={cardVariant}>
            <Card
              className="arcory-glass cursor-pointer hover:border-primary/40 transition-all group"
              onClick={() => setSelectedSupplier(group)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="rounded-lg bg-primary/10 p-2 shrink-0">
                      <Building2 className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {group.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {group.documents.length} bon{group.documents.length !== 1 ? "nen" : ""}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <TrendingDown className="h-3.5 w-3.5" />
                    <span className="text-xs">Totaal</span>
                  </div>
                  <p className="text-sm font-semibold tabular-nums text-foreground">
                    € {group.totalAmount.toLocaleString("nl-NL", { minimumFractionDigits: 2 })}
                  </p>
                </div>

                {group.lastDate && (
                  <p className="text-[10px] text-muted-foreground mt-2">
                    Laatste: {new Date(group.lastDate).toLocaleDateString("nl-NL", { day: "2-digit", month: "short", year: "numeric" })}
                  </p>
                )}

                {group.contactId && (
                  <Badge variant="outline" className="text-[10px] mt-2 border-primary/30 text-primary">
                    Crediteur
                  </Badge>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {ungrouped.length > 0 && (
        <div className="mt-4 text-xs text-muted-foreground flex items-center gap-1">
          <Receipt className="h-3.5 w-3.5" />
          {ungrouped.length} bon{ungrouped.length !== 1 ? "nen" : ""} zonder herkende leverancier
        </div>
      )}

      <SupplierReceiptsSheet
        supplier={selectedSupplier}
        open={!!selectedSupplier}
        onClose={() => setSelectedSupplier(null)}
        onSelectDoc={onSelectDoc}
        orgId={orgId}
      />
    </>
  );
}
