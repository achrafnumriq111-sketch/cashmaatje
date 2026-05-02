import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, ArrowLeftRight, FileText, GitMerge,
  Receipt, BarChart3, Users, BookOpen,
  Settings, Shield, Wallet, ChevronDown, FileCheck, Briefcase,
  Building2, Plug, Calculator, Lock, Flame, X,
  Folder, HeartPulse, FlaskConical, UserCheck, Database as DatabaseIcon,
} from "lucide-react";
import { useMobileNav } from "./MobileNavContext";
import { useI18n } from "@/lib/i18n";
import { useEntitlements } from "@/hooks/useEntitlements";
import type { Database } from "@/integrations/supabase/types";

type UserRole = Database["public"]["Enums"]["user_role"];

interface NavChild {
  id: string;
  labelKey: string;
  path: string;
  moduleKey?: string;
}
interface NavItem {
  id: string;
  labelKey: string;
  icon: React.ReactNode;
  path?: string;
  moduleKey?: string;
  children?: NavChild[];
}
interface NavSection {
  id: string;
  label: string;
  items: NavItem[];
}

/* Clean, deduplicated navigation — 5 sections, max collapse, related items grouped */
const navSections: NavSection[] = [
  {
    id: "overview",
    label: "Overview",
    items: [
      { id: "structuur", labelKey: "Corporate Structure", icon: <Building2 size={16} />, path: "/" },
      { id: "dashboard", labelKey: "common.dashboard", icon: <LayoutDashboard size={16} />, path: "/dashboard" },
      { id: "fix-the-chaos", labelKey: "Fix the chaos", icon: <Flame size={16} />, path: "/fix-the-chaos" },
    ],
  },
  {
    id: "money",
    label: "Money",
    items: [
      { id: "transacties", labelKey: "nav.transactions", icon: <ArrowLeftRight size={16} />, path: "/transacties" },
      {
        id: "facturen", labelKey: "nav.invoices", icon: <FileText size={16} />,
        children: [
          { id: "verkoop", labelKey: "nav.invoices.sales", path: "/facturen/verkoop" },
          { id: "inkoop", labelKey: "nav.invoices.purchase", path: "/facturen/inkoop" },
          { id: "terugkerend", labelKey: "Terugkerend", path: "/facturen/terugkerend" },
          { id: "herinneringen", labelKey: "nav.invoices.reminders", path: "/facturen/herinneringen" },
          { id: "offerte-studio", labelKey: "nav.quotes", path: "/offerte-studio" },
        ],
      },
      {
        id: "reconciliatie", labelKey: "nav.reconciliation", icon: <GitMerge size={16} />,
        children: [
          { id: "reconciliatie-overzicht", labelKey: "Overzicht", path: "/reconciliatie" },
          { id: "bank-import", labelKey: "Bank import", path: "/bank/import" },
        ],
      },
      {
        id: "documenten", labelKey: "nav.documents", icon: <Folder size={16} />,
        children: [
          { id: "documenten-overzicht", labelKey: "Documenten", path: "/documenten" },
          { id: "inbox", labelKey: "Inbox", path: "/inbox" },
        ],
      },
    ],
  },
  {
    id: "belasting",
    label: "Belasting",
    items: [
      {
        id: "btw", labelKey: "BTW", icon: <Receipt size={16} />,
        children: [
          { id: "btw-aangifte", labelKey: "nav.vat.return", path: "/btw/aangifte" },
          { id: "btw-icp", labelKey: "nav.vat.icp", path: "/btw/icp" },
        ],
      },
      {
        id: "vpb", labelKey: "Vennootschapsbelasting", icon: <Calculator size={16} />,
        children: [
          { id: "vpb-aangifte", labelKey: "VPB-aangifte", path: "/belasting/vpb" },
          { id: "belasting-reserve", labelKey: "Belastingreserve", path: "/belasting/reserve" },
          { id: "belasting-checklist", labelKey: "Kwartaal-checklist", path: "/belasting/checklist" },
          { id: "ondernemersaftrek", labelKey: "nav.taxDeductions", path: "/belasting/ondernemersaftrek" },
        ],
      },
      {
        id: "kosten-activa", labelKey: "Kosten & afschrijvingen", icon: <Wallet size={16} />,
        children: [
          { id: "bedrijfskosten", labelKey: "nav.businessExpenses", path: "/salaris/bedrijfskosten" },
          { id: "afschrijvingen", labelKey: "nav.depreciations", path: "/salaris/afschrijvingen" },
          { id: "auto", labelKey: "nav.companyCar", path: "/salaris/auto" },
          { id: "woning", labelKey: "nav.mortgage", path: "/salaris/woning" },
        ],
      },
      {
        id: "salaris", labelKey: "Salaris & personeel", icon: <Users size={16} />,
        children: [
          { id: "salaris-overzicht", labelKey: "nav.salary.overview", path: "/salaris" },
          { id: "salaris-medewerkers", labelKey: "nav.salary.employees", path: "/salaris/medewerkers" },
          { id: "premies", labelKey: "nav.premiums", path: "/salaris/premies" },
          { id: "kilometers", labelKey: "Kilometerregistratie", path: "/salaris/kilometers" },
          { id: "toeslagen", labelKey: "Toeslagen-check", path: "/salaris/toeslagen" },
          { id: "uren", labelKey: "Urenregistratie", path: "/uren" },
          { id: "agenda", labelKey: "Agenda", path: "/agenda" },
        ],
      },
    ],
  },
  {
    id: "insights",
    label: "Insights",
    items: [
      {
        id: "rapporten", labelKey: "nav.reports", icon: <BarChart3 size={16} />,
        children: [
          { id: "wv", labelKey: "nav.profitLoss", path: "/rapporten/winst-verlies" },
          { id: "balans", labelKey: "nav.balanceSheet", path: "/rapporten/balans" },
          { id: "proefbalans", labelKey: "nav.trialBalance", path: "/rapporten/proefbalans" },
          { id: "cashflow", labelKey: "nav.cashflow", path: "/rapporten/cashflow" },
          { id: "jaarrekening", labelKey: "nav.annualReport", path: "/rapporten/jaarrekening", moduleKey: "annual_report" },
          { id: "intelligence", labelKey: "nav.intelligence", path: "/rapporten/intelligence", moduleKey: "financial_intelligence" },
        ],
      },
      { id: "health-score", labelKey: "Financiële gezondheid", icon: <HeartPulse size={16} />, path: "/insights/health" },
      { id: "scenario", labelKey: "Scenario simulator", icon: <FlaskConical size={16} />, path: "/insights/scenario" },
      { id: "accountant-portal", labelKey: "Accountant portal", icon: <UserCheck size={16} />, path: "/accountant" },
    ],
  },
  {
    id: "workspace",
    label: "Workspace",
    items: [
      {
        id: "data", labelKey: "Data", icon: <DatabaseIcon size={16} />,
        children: [
          { id: "relaties", labelKey: "nav.contacts", path: "/relaties" },
          { id: "grootboek", labelKey: "nav.ledger", path: "/grootboek" },
          { id: "journaalposten", labelKey: "nav.journal", path: "/journaalposten" },
          { id: "voorraad", labelKey: "nav.inventory", path: "/voorraad" },
          { id: "exports", labelKey: "Export Center", path: "/exports" },
        ],
      },
      {
        id: "audit", labelKey: "nav.audit", icon: <FileCheck size={16} />,
        children: [
          { id: "audit-dossier", labelKey: "nav.audit.dossier", path: "/audit/dossier", moduleKey: "audit_dossier" },
          { id: "contract-check", labelKey: "nav.audit.contracts", path: "/audit/contracten", moduleKey: "contract_intelligence" },
          { id: "compliance", labelKey: "nav.audit.compliance", path: "/audit/compliance", moduleKey: "compliance_check" },
          { id: "process-flows", labelKey: "nav.audit.processes", path: "/audit/processen", moduleKey: "process_flows" },
        ],
      },
      {
        id: "platform", labelKey: "nav.platform", icon: <Briefcase size={16} />,
        children: [
          { id: "stakeholders", labelKey: "nav.platform.stakeholders", path: "/platform/stakeholders", moduleKey: "stakeholder_crm" },
          { id: "automation", labelKey: "nav.platform.automation", path: "/platform/automation", moduleKey: "automation_center" },
          { id: "themas", labelKey: "nav.platform.themes", path: "/platform/themas" },
        ],
      },
      { id: "integraties", labelKey: "nav.integrations", icon: <Plug size={16} />, path: "/integraties" },
      { id: "boekhoudregels", labelKey: "Boekhoudregels", icon: <BookOpen size={16} />, path: "/instellingen/bulk" },
      { id: "gebruikers", labelKey: "Gebruikers & rechten", icon: <Users size={16} />, path: "/instellingen/gebruikers" },
    ],
  },
];

/* Flat list of items needed for active-parent detection */
const allItems = navSections.flatMap((s) => s.items);

export function AppSidebar({ role }: { role?: UserRole }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { isUnlocked } = useEntitlements();
  const [expanded, setExpanded] = useState<string | null>(null);
  const path = location.pathname;

  const isActive = (item: NavItem) =>
    item.path ? (item.path === "/" ? path === "/" : path === item.path || path.startsWith(item.path + "/")) : false;

  const isChildActive = (item: NavItem) =>
    item.children?.some((c) => path === c.path || path.startsWith(c.path + "/")) ?? false;

  const handleClick = (item: NavItem) => {
    if (item.children) setExpanded(expanded === item.id ? null : item.id);
    else if (item.path) navigate(item.path);
  };

  const activeParent = allItems.find((i) => i.children && isChildActive(i));

  const renderItem = (item: NavItem) => {
    const active = isActive(item) || isChildActive(item);
    const isOpen = expanded === item.id || (activeParent?.id === item.id && expanded === null);

    return (
      <div key={item.id}>
        <button
          onClick={() => handleClick(item)}
          className={`
            w-full flex items-center gap-3 pl-4 pr-3 py-2 rounded-xl
            text-[13.5px] transition-colors duration-150 ease-out
            group relative
            ${active
              ? "text-foreground bg-secondary/70"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
            }
          `}
        >
          {/* Active indicator dot */}
          <span
            className={`absolute left-1 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full transition-all duration-200
              ${active ? "bg-primary scale-100 opacity-100" : "scale-0 opacity-0"}`}
          />
          <span
            className={`w-4 h-4 flex items-center justify-center flex-shrink-0 transition-colors
              ${active ? "text-foreground" : "text-muted-foreground/80 group-hover:text-foreground"}`}
          >
            {item.icon}
          </span>
          <span className={`flex-1 text-left truncate ${active ? "font-medium" : ""}`}>
            {t(item.labelKey)}
          </span>
          {item.children && (
            <motion.span
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.18 }}
              className="text-muted-foreground/60"
            >
              <ChevronDown className="w-3 h-3" />
            </motion.span>
          )}
        </button>

        <AnimatePresence initial={false}>
          {item.children && isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="ml-7 mt-0.5 mb-1 pl-3 border-l border-border/70 space-y-0.5 py-0.5">
                {item.children.map((child) => {
                  const childActive = path === child.path || path.startsWith(child.path + "/");
                  const locked = child.moduleKey ? !isUnlocked(child.moduleKey) : false;
                  return (
                    <button
                      key={child.id}
                      onClick={() => navigate(child.path)}
                      className={`
                        w-full text-left px-3 py-1.5 rounded-lg text-[12.5px]
                        transition-colors duration-150 flex items-center justify-between gap-2
                        ${childActive
                          ? "text-foreground font-medium bg-[hsl(var(--primary-soft))]"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                        }
                      `}
                    >
                      <span className="truncate">{t(child.labelKey)}</span>
                      {locked && <Lock className="w-3 h-3 text-muted-foreground/60 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const { open, setOpen } = useMobileNav();

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden fixed inset-0 z-40 bg-background/70 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      <aside
        className={`
          w-[280px] md:w-[260px] h-screen fixed left-0 top-0 z-50
          bg-card border-r border-border flex flex-col overflow-y-auto overflow-x-hidden
          transition-transform duration-300 ease-out
          ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0
        `}
        style={{ scrollbarWidth: "none" }}
      >
        {/* Brand + mobile close */}
        <div className="px-5 h-16 flex items-center justify-between gap-2.5 flex-shrink-0">
          <a
            href="https://cashmaatje.nl"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
            aria-label="Cashmaatje website"
          >
            <div className="w-7 h-7 rounded-lg bg-primary grid place-items-center">
              <span className="text-primary-foreground text-[13px] font-semibold leading-none">C</span>
            </div>
            <span className="text-[15px] font-semibold tracking-tight text-foreground">Cash Maatje</span>
          </a>
          <button
            onClick={() => setOpen(false)}
            className="md:hidden -mr-2 w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 pb-4 space-y-5">
          {navSections.map((section) => (
            <div key={section.id} className="space-y-0.5">
              <div className="px-4 mb-1.5">
                <span className="text-[10.5px] font-medium tracking-[0.08em] uppercase text-muted-foreground/60">
                  {section.label}
                </span>
              </div>
              {section.items.map(renderItem)}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-3 py-3 border-t border-border space-y-0.5 flex-shrink-0 bg-card">
          <button
            onClick={() => navigate("/instellingen")}
            className={`w-full flex items-center gap-3 pl-4 pr-3 py-2 rounded-xl text-[13.5px] transition-colors duration-150 ${
              path === "/instellingen"
                ? "text-foreground bg-secondary/70 font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>{t("nav.settings")}</span>
          </button>
          {role === "accountant" && (
            <button
              onClick={() => navigate("/audit-log")}
              className={`w-full flex items-center gap-3 pl-4 pr-3 py-2 rounded-xl text-[13.5px] transition-colors duration-150 ${
                path === "/audit-log"
                  ? "text-foreground bg-secondary/70 font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>{t("nav.auditLog")}</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
}

