import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, ChevronDown, Check, Settings2, Layers } from "lucide-react";
import { useOrganization } from "@/hooks/useOrganization";
import { useI18n } from "@/lib/i18n";
import { useQueryClient } from "@tanstack/react-query";
import { EditOrgDialog } from "./EditOrgDialog";

export function OrgSwitcher() {
  const { membership, memberships, switchOrganization } = useOrganization();
  const { t } = useI18n();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  if (!membership) return null;

  const handleSwitch = (id: string) => {
    if (id === membership.organizationId) return;
    switchOrganization(id);
    qc.invalidateQueries();
    setOpen(false);
  };

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 pl-2.5 pr-2 py-1.5 rounded-lg hover:bg-secondary transition-all duration-200 text-[13px]"
        >
          <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-foreground font-medium max-w-[160px] truncate">{membership.organizationName}</span>
          <ChevronDown className="w-3 h-3 text-muted-foreground" />
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div className="absolute right-0 top-11 z-50 w-72 rounded-xl bg-card border border-border shadow-lg overflow-hidden">
              <div className="px-3 py-2 border-b border-border">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
                  {t("header.switchOrg")} ({memberships.length})
                </p>
              </div>
              <div className="max-h-72 overflow-auto">
                {memberships.map((m) => {
                  const isActive = m.organizationId === membership.organizationId;
                  return (
                    <button
                      key={m.organizationId}
                      onClick={() => handleSwitch(m.organizationId)}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-[13px] text-foreground hover:bg-secondary transition-colors"
                    >
                      <span className={`w-2 h-2 rounded-full ${isActive ? "bg-primary" : "bg-muted-foreground/30"}`} />
                      <span className="flex-1 text-left truncate">{m.organizationName}</span>
                      <span className="text-[10px] text-muted-foreground capitalize">{m.role}</span>
                      {isActive && <Check className="w-3.5 h-3.5 text-primary" />}
                    </button>
                  );
                })}
              </div>
              <div className="border-t border-border" />
              <button
                onClick={() => { setOpen(false); setEditOpen(true); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <Settings2 className="w-3.5 h-3.5" /> {t("header.editOrg")}
              </button>
              <button
                onClick={() => { setOpen(false); navigate("/instellingen/bulk"); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <Layers className="w-3.5 h-3.5" /> {t("header.bulkSettings")}
              </button>
            </div>
          </>
        )}
      </div>
      <EditOrgDialog open={editOpen} onClose={() => setEditOpen(false)} />
    </>
  );
}
