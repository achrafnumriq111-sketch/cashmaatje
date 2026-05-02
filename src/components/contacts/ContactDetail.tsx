import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useContactStats } from "@/hooks/useContacts";
import { Building2, User, Globe, Mail, Phone, CreditCard, FileText, ArrowLeftRight, TrendingUp, Calendar } from "lucide-react";
import { ContactActivityLog } from "./ContactActivityLog";
import { EntityRolesEditor } from "./EntityRolesEditor";

function fmtAmount(n: number) {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(n);
}

const EU_COUNTRIES = ["NL","BE","DE","FR","IT","ES","AT","IE","LU","PT","GR","FI","SE","DK","PL","CZ","SK","HU","RO","BG","HR","SI","EE","LV","LT","CY","MT"];

interface Props {
  contact: any | null;
  open: boolean;
  onClose: () => void;
}

export function ContactDetail({ contact, open, onClose }: Props) {
  const { data: stats, isLoading } = useContactStats(contact?.id ?? null);

  const country = contact?.address_country ?? "NL";
  const isDomestic = country === "NL";
  const isEu = EU_COUNTRIES.includes(country);

  const vatTreatment = isDomestic ? "Binnenland (NL)"
    : isEu && contact?.btw_number ? "ICP / Verlegd"
    : isEu ? "EU (geen geldig BTW-nr)"
    : "Export buiten EU (0%)";

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        {contact && (
          <>
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                {contact.is_supplier ? <Building2 className="h-5 w-5 text-muted-foreground" /> : <User className="h-5 w-5 text-muted-foreground" />}
                {contact.name}
              </SheetTitle>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              {/* Contact info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                {contact.legal_name && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground text-xs">Rechtsnaam</p>
                    <p className="font-medium">{contact.legal_name}</p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground text-xs">Type</p>
                  <div className="flex gap-1.5 mt-0.5">
                    {contact.is_supplier && <Badge variant="outline" className="text-[10px]">Leverancier</Badge>}
                    {contact.is_customer && <Badge variant="outline" className="text-[10px]">Klant</Badge>}
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs flex items-center gap-1"><Globe className="h-3 w-3" /> Land</p>
                  <p className="font-medium">{country}</p>
                </div>
                {contact.btw_number && (
                  <div>
                    <p className="text-muted-foreground text-xs">BTW-nummer</p>
                    <p className="font-mono text-sm">{contact.btw_number}</p>
                    {contact.btw_number_verified && (
                      <Badge variant="secondary" className="text-[10px] bg-emerald-500/15 text-emerald-400 border-0 mt-1">Geverifieerd</Badge>
                    )}
                  </div>
                )}
                {contact.kvk_number && (
                  <div>
                    <p className="text-muted-foreground text-xs">KVK-nummer</p>
                    <p className="font-mono text-sm">{contact.kvk_number}</p>
                  </div>
                )}
                {contact.email && (
                  <div>
                    <p className="text-muted-foreground text-xs flex items-center gap-1"><Mail className="h-3 w-3" /> Email</p>
                    <p className="text-sm">{contact.email}</p>
                  </div>
                )}
                {contact.phone && (
                  <div>
                    <p className="text-muted-foreground text-xs flex items-center gap-1"><Phone className="h-3 w-3" /> Telefoon</p>
                    <p className="text-sm">{contact.phone}</p>
                  </div>
                )}
                {contact.iban && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground text-xs flex items-center gap-1"><CreditCard className="h-3 w-3" /> IBAN</p>
                    <p className="font-mono text-sm">{contact.iban}</p>
                  </div>
                )}
              </div>

              <Separator />

              {/* VAT Treatment */}
              <div className="rounded-md bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground mb-1">BTW-behandeling</p>
                <p className="text-sm font-medium">{vatTreatment}</p>
                {contact.default_vat_rate_type && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Standaard tarief: <Badge variant="outline" className="text-[10px]">{contact.default_vat_rate_type}</Badge>
                  </p>
                )}
              </div>

              <Separator />

              {/* Stats */}
              <div>
                <h3 className="text-sm font-medium mb-3">Inzichten</h3>
                {isLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
                  </div>
                ) : stats ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-md bg-muted/20 p-3">
                      <p className="text-xs text-muted-foreground flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Totaal volume</p>
                      <p className="text-lg font-semibold tabular-nums">{fmtAmount(stats.totalVolume)}</p>
                    </div>
                    <div className="rounded-md bg-muted/20 p-3">
                      <p className="text-xs text-muted-foreground">BTW verrekend</p>
                      <p className="text-lg font-semibold tabular-nums">{fmtAmount(stats.totalVat)}</p>
                    </div>
                    <div className="rounded-md bg-muted/20 p-3">
                      <p className="text-xs text-muted-foreground flex items-center gap-1"><ArrowLeftRight className="h-3 w-3" /> Transacties</p>
                      <p className="text-lg font-semibold">{stats.transactionCount}</p>
                    </div>
                    <div className="rounded-md bg-muted/20 p-3">
                      <p className="text-xs text-muted-foreground flex items-center gap-1"><FileText className="h-3 w-3" /> Facturen</p>
                      <p className="text-lg font-semibold">{stats.invoiceCount}</p>
                    </div>
                    <div className="rounded-md bg-muted/20 p-3">
                      <p className="text-xs text-muted-foreground">Documenten</p>
                      <p className="text-lg font-semibold">{stats.documentCount}</p>
                    </div>
                    {stats.lastActivity && (
                      <div className="rounded-md bg-muted/20 p-3">
                        <p className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" /> Laatste activiteit</p>
                        <p className="text-sm font-medium">
                          {new Date(stats.lastActivity).toLocaleDateString("nl-NL", { day: "2-digit", month: "short", year: "numeric" })}
                        </p>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>

              <Separator />

              <div>
                <p className="text-xs text-muted-foreground mb-2">Rollen binnen organisatie</p>
                <EntityRolesEditor contactId={contact.id} organizationId={contact.organization_id} />
              </div>

              <Separator />

              <ContactActivityLog contactId={contact.id} email={contact.email} phone={contact.phone} />
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
