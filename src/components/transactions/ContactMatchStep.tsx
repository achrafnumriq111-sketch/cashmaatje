import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Sparkles, UserPlus, Link2, X } from "lucide-react";
import type { CounterpartyGroup, ContactRow } from "@/lib/contactMatcher";

interface Props {
  groups: CounterpartyGroup[];
  contacts: ContactRow[];
  onChange: (groups: CounterpartyGroup[]) => void;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(n);

export function ContactMatchStep({ groups, contacts, onChange }: Props) {
  const stats = useMemo(() => {
    const link = groups.filter((g) => g.action.kind === "link").length;
    const create = groups.filter((g) => g.action.kind === "create").length;
    const skip = groups.filter((g) => g.action.kind === "skip").length;
    return { link, create, skip };
  }, [groups]);

  const update = (idx: number, patch: Partial<CounterpartyGroup>) => {
    const next = groups.slice();
    next[idx] = { ...next[idx], ...patch };
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 text-xs">
        <Badge variant="secondary" className="gap-1"><Link2 className="h-3 w-3" />{stats.link} koppelen</Badge>
        <Badge variant="secondary" className="gap-1"><UserPlus className="h-3 w-3" />{stats.create} nieuw</Badge>
        <Badge variant="outline" className="gap-1"><X className="h-3 w-3" />{stats.skip} overslaan</Badge>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">Tegenpartij ({groups.length})</TableHead>
                <TableHead className="text-right">Tx</TableHead>
                <TableHead className="text-right">Bedrag</TableHead>
                <TableHead>AI suggestie</TableHead>
                <TableHead>Actie</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.map((g, i) => (
                <TableRow key={g.key}>
                  <TableCell className="align-top">
                    <div className="flex items-start gap-2">
                      {g.direction === "in" && <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-500 mt-0.5" />}
                      {g.direction === "out" && <ArrowUpRight className="h-3.5 w-3.5 text-destructive mt-0.5" />}
                      {g.direction === "mixed" && <ArrowLeftRight className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />}
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{g.displayName}</div>
                        {g.iban && <div className="text-[10px] text-muted-foreground font-mono">{g.iban}</div>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-xs tabular-nums">{g.txCount}</TableCell>
                  <TableCell className={`text-right text-xs tabular-nums ${g.totalAmount < 0 ? "text-destructive" : "text-emerald-500"}`}>
                    {fmt(g.totalAmount)}
                  </TableCell>
                  <TableCell>
                    {g.suggestion ? (
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="h-3 w-3 text-primary" />
                        <span className="text-xs truncate max-w-[150px]">{g.suggestion.contact.name}</span>
                        <Badge variant="outline" className="text-[9px] px-1 py-0">
                          {Math.round(g.suggestion.confidence * 100)}% · {g.suggestion.reason}
                        </Badge>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1.5">
                      <Select
                        value={g.action.kind}
                        onValueChange={(v) => {
                          if (v === "link") {
                            const id = g.suggestion?.contact.id ?? contacts[0]?.id;
                            if (id) update(i, { action: { kind: "link", contactId: id } });
                          } else if (v === "create") {
                            update(i, {
                              action: {
                                kind: "create",
                                name: g.displayName,
                                iban: g.iban,
                                isCustomer: g.direction !== "out",
                                isSupplier: g.direction !== "in",
                              },
                            });
                          } else update(i, { action: { kind: "skip" } });
                        }}
                      >
                        <SelectTrigger className="h-7 text-xs w-[130px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="link">Koppelen</SelectItem>
                          <SelectItem value="create">Nieuw aanmaken</SelectItem>
                          <SelectItem value="skip">Overslaan</SelectItem>
                        </SelectContent>
                      </Select>

                      {g.action.kind === "link" && (
                        <Select
                          value={g.action.contactId}
                          onValueChange={(v) => update(i, { action: { kind: "link", contactId: v } })}
                        >
                          <SelectTrigger className="h-7 text-xs w-[200px]"><SelectValue /></SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            {contacts.map((c) => (
                              <SelectItem key={c.id} value={c.id} className="text-xs">{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}

                      {g.action.kind === "create" && (
                        <Input
                          value={g.action.name}
                          onChange={(e) => update(i, { action: { ...g.action, kind: "create", name: e.target.value } as any })}
                          className="h-7 text-xs w-[200px]"
                          placeholder="Contactnaam"
                        />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
