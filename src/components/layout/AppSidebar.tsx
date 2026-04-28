import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, ArrowLeftRight, FileText, GitMerge,
  Receipt, BarChart3, Users, BookOpen, ScrollText,
  Settings, Shield, Wallet, ChevronDown, FileCheck, Briefcase,
  Palette, Building2, Boxes, Plug, Calculator, Lock, Flame,
} from "lucide-react";
import { staggerContainer, sidebarItemVariant, sidebarSubMenuVariant } from "@/lib/animations";
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

const navItems: NavItem[] = [
  { id: "dashboard", labelKey: "common.dashboard", icon: <LayoutDashboard size={18} />, path: "/" },
  { id: "fix-the-chaos", labelKey: "FIX THE CHAOS", icon: <Flame size={18} />, path: "/fix-the-chaos" },
  { id: "transacties", labelKey: "nav.transactions", icon: <ArrowLeftRight size={18} />, path: "/transacties" },
  {
    id: "facturen", labelKey: "nav.invoices", icon: <FileText size={18} />,
    children: [
      { id: "verkoop", labelKey: "nav.invoices.sales", path: "/facturen/verkoop" },
      { id: "inkoop", labelKey: "nav.invoices.purchase", path: "/facturen/inkoop" },
      { id: "herinneringen", labelKey: "nav.invoices.reminders", path: "/facturen/herinneringen" },
    ],
  },
  { id: "reconciliatie", labelKey: "nav.reconciliation", icon: <GitMerge size={18} />, path: "/reconciliatie" },
  { id: "documenten", labelKey: "nav.documents", icon: <FileText size={18} />, path: "/documenten" },
  {
    id: "btw", labelKey: "nav.vatWins", icon: <Receipt size={18} />,
    children: [
      { id: "btw-aangifte", labelKey: "nav.vat.return", path: "/btw/aangifte" },
      { id: "btw-icp", labelKey: "nav.vat.icp", path: "/btw/icp" },
      { id: "vpb", labelKey: "nav.vat.vpb", path: "/belasting/vpb" },
    ],
  },
  {
    id: "kosten-activa", labelKey: "nav.costs", icon: <Calculator size={18} />,
    children: [
      { id: "bedrijfskosten", labelKey: "nav.businessExpenses", path: "/salaris/bedrijfskosten" },
      { id: "afschrijvingen", labelKey: "nav.depreciations", path: "/salaris/afschrijvingen" },
      { id: "premies", labelKey: "nav.premiums", path: "/salaris/premies" },
      { id: "auto", labelKey: "nav.companyCar", path: "/salaris/auto" },
      { id: "woning", labelKey: "nav.mortgage", path: "/salaris/woning" },
      { id: "ondernemersaftrek", labelKey: "nav.taxDeductions", path: "/belasting/ondernemersaftrek" },
    ],
  },
  {
    id: "salaris", labelKey: "nav.salary", icon: <Wallet size={18} />,
    children: [
      { id: "salaris-overzicht", labelKey: "nav.salary.overview", path: "/salaris" },
      { id: "salaris-medewerkers", labelKey: "nav.salary.employees", path: "/salaris/medewerkers" },
    ],
  },
  {
    id: "rapporten", labelKey: "nav.reports", icon: <BarChart3 size={18} />,
    children: [
      { id: "wv", labelKey: "nav.profitLoss", path: "/rapporten/winst-verlies" },
      { id: "balans", labelKey: "nav.balanceSheet", path: "/rapporten/balans" },
      { id: "proefbalans", labelKey: "nav.trialBalance", path: "/rapporten/proefbalans" },
      { id: "cashflow", labelKey: "nav.cashflow", path: "/rapporten/cashflow" },
      { id: "jaarrekening", labelKey: "nav.annualReport", path: "/rapporten/jaarrekening", moduleKey: "annual_report" },
      { id: "intelligence", labelKey: "nav.intelligence", path: "/rapporten/intelligence", moduleKey: "financial_intelligence" },
    ],
  },
  { id: "relaties", labelKey: "nav.contacts", icon: <Users size={18} />, path: "/relaties" },
  { id: "grootboek", labelKey: "nav.ledger", icon: <BookOpen size={18} />, path: "/grootboek" },
  { id: "journaalposten", labelKey: "nav.journal", icon: <ScrollText size={18} />, path: "/journaalposten" },
  { id: "voorraad", labelKey: "nav.inventory", icon: <Boxes size={18} />, path: "/voorraad" },
  { id: "integraties", labelKey: "nav.integrations", icon: <Plug size={18} />, path: "/integraties" },
  { id: "offerte-studio", labelKey: "nav.quotes", icon: <Briefcase size={18} />, path: "/offerte-studio" },
  {
    id: "audit", labelKey: "nav.audit", icon: <FileCheck size={18} />,
    children: [
      { id: "audit-dossier", labelKey: "nav.audit.dossier", path: "/audit/dossier", moduleKey: "audit_dossier" },
      { id: "contract-check", labelKey: "nav.audit.contracts", path: "/audit/contracten", moduleKey: "contract_intelligence" },
      { id: "compliance", labelKey: "nav.audit.compliance", path: "/audit/compliance", moduleKey: "compliance_check" },
      { id: "process-flows", labelKey: "nav.audit.processes", path: "/audit/processen", moduleKey: "process_flows" },
    ],
  },
  {
    id: "platform", labelKey: "nav.platform", icon: <Building2 size={18} />,
    children: [
      { id: "stakeholders", labelKey: "nav.platform.stakeholders", path: "/platform/stakeholders", moduleKey: "stakeholder_crm" },
      { id: "automation", labelKey: "nav.platform.automation", path: "/platform/automation", moduleKey: "automation_center" },
      { id: "corporate", labelKey: "nav.platform.structure", path: "/platform/structuur", moduleKey: "corporate_structure" },
    ],
  },
];

export function AppSidebar({ role }: { role?: UserRole }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { isUnlocked } = useEntitlements();
  const [expanded, setExpanded] = useState<string | null>(null);
  const path = location.pathname;

  const isActive = (item: NavItem) => {
    if (item.path) return item.path === "/" ? path === "/" : path === item.path || path.startsWith(item.path + "/");
    return false;
  };

  const isChildActive = (item: NavItem) =>
    item.children?.some((c) => path === c.path || path.startsWith(c.path + "/")) ?? false;

  const handleClick = (item: NavItem) => {
    if (item.children) {
      setExpanded(expanded === item.id ? null : item.id);
    } else if (item.path) {
      navigate(item.path);
    }
  };

  const activeParent = navItems.find((i) => i.children && isChildActive(i));

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="w-[260px] h-screen fixed left-0 top-0 z-40 bg-card border-r border-border flex flex-col overflow-y-auto overflow-x-hidden"
      style={{ scrollbarWidth: "none" }}
    >
      {/* Brand — clickable to cashmaatje.nl */}
      <a
        href="https://cashmaatje.nl"
        target="_blank"
        rel="noopener noreferrer"
        className="px-5 py-5 flex items-center gap-3 hover:opacity-80 transition-opacity"
        aria-label="Cashmaatje website"
      >
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-teal-500 flex items-center justify-center shadow-sm">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
        <div className="flex flex-col">
          <span className="text-[14px] font-semibold text-foreground leading-tight tracking-tight">Cashmaatje</span>
          <span className="text-[12px] text-muted-foreground leading-tight">Financial OS</span>
        </div>
      </a>

      <div className="mx-4 h-px bg-border" />

      {/* Nav */}
      <motion.nav
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="flex-1 px-3 py-4 space-y-0.5"
      >
        {navItems.map((item) => {
          const active = isActive(item) || isChildActive(item);
          const isOpen = expanded === item.id || (activeParent?.id === item.id && expanded === null);

          return (
            <motion.div key={item.id} variants={sidebarItemVariant}>
              <button
                onClick={() => handleClick(item)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                  text-[13px] font-medium transition-all duration-200 ease-out
                  group relative overflow-hidden
                  ${active
                    ? "text-foreground bg-secondary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                  }
                `}
              >
                {active && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className={`w-5 h-5 flex items-center justify-center flex-shrink-0 transition-colors duration-200 ${active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`}>
                  {item.icon}
                </span>
                <span className="flex-1 text-left">{t(item.labelKey)}</span>
                {item.children && (
                  <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                  </motion.div>
                )}
              </button>

              <AnimatePresence>
                {item.children && isOpen && (
                  <motion.div
                    variants={sidebarSubMenuVariant}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="overflow-hidden"
                  >
                    <div className="ml-8 mt-0.5 space-y-0.5 py-1">
                      {item.children.map((child) => {
                        const childActive = path === child.path || path.startsWith(child.path + "/");
                        const locked = child.moduleKey ? !isUnlocked(child.moduleKey) : false;
                        return (
                          <button
                            key={child.id}
                            onClick={() => navigate(child.path)}
                            className={`
                              w-full text-left px-3 py-2 rounded-lg text-[12.5px]
                              transition-all duration-200 flex items-center justify-between gap-2
                              ${childActive
                                ? "text-primary font-medium bg-primary/[0.06]"
                                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
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
            </motion.div>
          );
        })}
      </motion.nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-border space-y-0.5">
        <button
          onClick={() => navigate("/platform/themas")}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${
            path === "/platform/themas" ? "text-foreground bg-secondary" : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
          }`}
        >
          <Palette className="w-5 h-5" />
          <span>{t("nav.platform.themes")}</span>
        </button>
        <button
          onClick={() => navigate("/instellingen")}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${
            path === "/instellingen" ? "text-foreground bg-secondary" : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
          }`}
        >
          <Settings className="w-5 h-5" />
          <span>{t("nav.settings")}</span>
        </button>
        {role === "accountant" && (
          <button
            onClick={() => navigate("/audit-log")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${
              path === "/audit-log" ? "text-foreground bg-secondary" : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
            }`}
          >
            <Shield className="w-5 h-5" />
            <span>{t("nav.auditLog")}</span>
          </button>
        )}
      </div>
    </motion.aside>
  );
}
