import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const ROLE_LABELS: Record<string, string> = {
  customer: "Klant",
  supplier: "Leverancier",
  shareholder: "Aandeelhouder",
  dga: "DGA",
  accountant: "Accountant",
  employee: "Werknemer",
  partner: "Partner",
};

interface Props {
  contactId: string;
  organizationId: string;
}

export function EntityRolesEditor({ contactId, organizationId }: Props) {
  const qc = useQueryClient();
  const [adding, setAdding] = useState<string>("");

  const { data: roles = [] } = useQuery({
    queryKey: ["entity_roles", contactId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entity_roles" as any)
        .select("*")
        .eq("contact_id", contactId);
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  const add = useMutation({
    mutationFn: async (role: string) => {
      const { error } = await supabase.from("entity_roles" as any).insert({
        organization_id: organizationId, contact_id: contactId, role,
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["entity_roles", contactId] }); setAdding(""); toast.success("Rol toegevoegd"); },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("entity_roles" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["entity_roles", contactId] }),
  });

  const existingRoles = roles.map((r: any) => r.role);
  const available = Object.keys(ROLE_LABELS).filter((r) => !existingRoles.includes(r));

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {roles.map((r: any) => (
          <Badge key={r.id} variant="secondary" className="gap-1">
            {ROLE_LABELS[r.role] ?? r.role}
            <button onClick={() => remove.mutate(r.id)} className="hover:text-destructive">
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        {roles.length === 0 && (
          <span className="text-xs text-muted-foreground">Nog geen rollen toegekend</span>
        )}
      </div>
      {available.length > 0 && (
        <div className="flex gap-2">
          <Select value={adding} onValueChange={setAdding}>
            <SelectTrigger className="w-48 h-8 text-xs"><SelectValue placeholder="+ Rol toevoegen" /></SelectTrigger>
            <SelectContent>
              {available.map((r) => <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button size="sm" disabled={!adding || add.isPending} onClick={() => adding && add.mutate(adding)}>
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}
