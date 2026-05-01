import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, GitBranch, Plus, User, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { useOrganization } from "@/hooks/useOrganization";
import { useEntities } from "@/hooks/useEntities";
import { useSubscription } from "@/hooks/useSubscription";
import { AddEntityDialog } from "@/components/structure/AddEntityDialog";
import { pageTransition, staggerContainer, cardVariant } from "@/lib/animations";
import { useNavigate } from "react-router-dom";

export default function CorporateStructure() {
  const { membership } = useOrganization();
  const { entities, isLoading } = useEntities();
  const sub = useSubscription();
  const navigate = useNavigate();
  const [addOpen, setAddOpen] = useState(false);

  const canAdd = sub.isActive && !!membership;

  return (
    <motion.div variants={pageTransition} initial="initial" animate="animate" exit="exit" className="space-y-6">
      <motion.div variants={cardVariant} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Corporate Structure</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Organogram en holding structuur — €15,99 per extra entiteit per maand
          </p>
        </div>
        <Button
          className="gap-1.5"
          onClick={() => (canAdd ? setAddOpen(true) : navigate("/pricing"))}
          disabled={!membership}
        >
          <Plus className="h-4 w-4" />
          Entiteit toevoegen
        </Button>
      </motion.div>

      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="flex flex-col items-center gap-4">
        {/* Owner node */}
        <motion.div variants={cardVariant}>
          <Card className="arcory-glass w-64 text-center">
            <CardContent className="pt-5 pb-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                <User className="h-6 w-6 text-primary" />
              </div>
              <p className="font-medium text-foreground">Eigenaar</p>
              <p className="text-xs text-muted-foreground">Natuurlijk persoon</p>
            </CardContent>
          </Card>
        </motion.div>

        <div className="w-px h-8 bg-border" />

        {/* Holding */}
        <motion.div variants={cardVariant}>
          <Card className="arcory-glass w-64 text-center border-primary/30">
            <CardContent className="pt-5 pb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-2">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <p className="font-medium text-foreground">{membership?.organizationName ?? "Holding BV"}</p>
              <Badge variant="outline" className="mt-1 text-[10px]">Hoofdorganisatie</Badge>
            </CardContent>
          </Card>
        </motion.div>

        {(isLoading || entities.length > 0) && <div className="w-px h-8 bg-border" />}

        {/* Subsidiaries */}
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : (
          <div className="flex gap-6 flex-wrap justify-center">
            {entities.map((e) => (
              <motion.div key={e.id} variants={cardVariant}>
                <Card className={`arcory-glass w-56 text-center transition-colors ${
                  e.is_active_addon ? "hover:border-primary/30" : "border-destructive/40 opacity-80"
                }`}>
                  <CardContent className="pt-4 pb-3">
                    <GitBranch className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm font-medium text-foreground truncate">{e.name}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{e.org_type?.toUpperCase()}</p>
                    <div className="flex items-center justify-center gap-1.5 mt-2">
                      <Badge variant="outline" className="text-[10px]">
                        {e.entity_ownership_pct ?? 100}%
                      </Badge>
                      {e.is_active_addon ? (
                        <Badge variant="outline" className="text-[10px] gap-1 text-primary border-primary/40">
                          <CheckCircle2 className="h-2.5 w-2.5" /> Actief
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] gap-1 text-destructive border-destructive/40">
                          <AlertCircle className="h-2.5 w-2.5" /> Betaling vereist
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {!isLoading && entities.length === 0 && (
          <p className="text-xs text-muted-foreground mt-2">
            Nog geen extra entiteiten — voeg er een toe voor €15,99 per maand.
          </p>
        )}
      </motion.div>

      {membership && (
        <AddEntityDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          parentOrganizationId={membership.organizationId}
        />
      )}
    </motion.div>
  );
}
