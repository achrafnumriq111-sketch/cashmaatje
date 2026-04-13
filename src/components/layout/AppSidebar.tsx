import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, ArrowLeftRight, FileText, GitMerge, Upload,
  Receipt, Camera, BarChart3, Users, BookOpen, ScrollText,
  Settings, Shield, Wallet, ChevronDown, FileCheck, Briefcase,
  Palette, Gift, Building2, GitBranch, Mail, FileSearch, Scale,
} from "lucide-react";
import { staggerContainer, sidebarItemVariant, sidebarSubMenuVariant } from "@/lib/animations";
import type { Database } from "@/integrations/supabase/types";

type UserRole = Database["public"]["Enums"]["user_role"];

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path?: string;
  children?: { id: string; label: string; path: string }[];
}

const navItems: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} />, path: "/" },
  { id: "transacties", label: "Transacties", icon: <ArrowLeftRight size={18} />, path: "/transacties" },
  {
    id: "facturen", label: "Facturen", icon: <FileText size={18} />,
    children: [
      { id: "verkoop", label: "Verkoop", path: "/facturen/verkoop" },
      { id: "inkoop", label: "Inkoop", path: "/facturen/inkoop" },
    ],
  },
  { id: "reconciliatie", label: "Reconciliatie", icon: <GitMerge size={18} />, path: "/reconciliatie" },
  { id: "bonnen", label: "Bonnen", icon: <Camera size={18} />, path: "/bonnen" },
  { id: "documenten", label: "Documenten", icon: <Upload size={18} />, path: "/documenten" },
  {
    id: "btw", label: "BTW", icon: <Receipt size={18} />,
    children: [
      { id: "btw-aangifte", label: "Aangifte", path: "/btw/aangifte" },
      { id: "btw-icp", label: "ICP Opgaaf", path: "/btw/icp" },
    ],
  },
  {
    id: "salaris", label: "Salaris", icon: <Wallet size={18} />,
    children: [
      { id: "salaris-overzicht", label: "Overzicht", path: "/salaris" },
      { id: "salaris-bedrijfskosten", label: "Bedrijfskosten", path: "/salaris/bedrijfskosten" },
      { id: "salaris-afschrijvingen", label: "Afschrijvingen", path: "/salaris/afschrijvingen" },
      { id: "salaris-aftrek", label: "Ondernemersaftrek", path: "/belasting/ondernemersaftrek" },
      { id: "salaris-premies", label: "Premies", path: "/salaris/premies" },
      { id: "salaris-auto", label: "Auto van de zaak", path: "/salaris/auto" },
      { id: "salaris-woning", label: "Koopwoning", path: "/salaris/woning" },
    ],
  },
  {
    id: "rapporten", label: "Rapporten", icon: <BarChart3 size={18} />,
    children: [
      { id: "wv", label: "Winst & Verlies", path: "/rapporten/winst-verlies" },
      { id: "balans", label: "Balans", path: "/rapporten/balans" },
      { id: "proefbalans", label: "Proefbalans", path: "/rapporten/proefbalans" },
      { id: "cashflow", label: "Cashflow", path: "/rapporten/cashflow" },
      { id: "jaarrekening", label: "Jaarrekening", path: "/rapporten/jaarrekening" },
      { id: "intelligence", label: "Financial Intelligence", path: "/rapporten/intelligence" },
    ],
  },
  { id: "relaties", label: "Relaties", icon: <Users size={18} />, path: "/relaties" },
  { id: "grootboek", label: "Grootboek", icon: <BookOpen size={18} />, path: "/grootboek" },
  { id: "journaalposten", label: "Journaalposten", icon: <ScrollText size={18} />, path: "/journaalposten" },
  { id: "offerte-studio", label: "Offertes & Branding", icon: <Briefcase size={18} />, path: "/offerte-studio" },
  {
    id: "audit", label: "Audit & Compliance", icon: <FileCheck size={18} />,
    children: [
      { id: "audit-dossier", label: "Audit Dossier", path: "/audit/dossier" },
      { id: "contract-check", label: "Contract Intelligence", path: "/audit/contracten" },
      { id: "compliance", label: "Compliance Check", path: "/audit/compliance" },
      { id: "process-flows", label: "Process & Controls", path: "/audit/processen" },
    ],
  },
  {
    id: "platform", label: "Platform", icon: <Building2 size={18} />,
    children: [
      { id: "stakeholders", label: "Stakeholder CRM", path: "/platform/stakeholders" },
      { id: "automation", label: "Automation Center", path: "/platform/automation" },
      { id: "corporate", label: "Corporate Structure", path: "/platform/structuur" },
      { id: "referral", label: "Referral Center", path: "/platform/referral" },
    ],
  },
];

export function AppSidebar({ role }: { role?: UserRole }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState<string | null>(null);
  const path = location.pathname;

  const isActive = (item: NavItem) => {
    if (item.path) return item.path === "/" ? path === "/" : path.startsWith(item.path);
    return false;
  };

  const isChildActive = (item: NavItem) =>
    item.children?.some((c) => path.startsWith(c.path)) ?? false;

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
      {/* Brand */}
      <div className="px-5 py-5 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-teal-500 flex items-center justify-center shadow-sm">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
        <div className="flex flex-col">
          <span className="text-[14px] font-semibold text-foreground leading-tight tracking-tight">Arcory</span>
          <span className="text-[12px] text-muted-foreground leading-tight">Financial OS</span>
        </div>
      </div>

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
                <span className="flex-1 text-left">{item.label}</span>
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
                        const childActive = path.startsWith(child.path);
                        return (
                          <button
                            key={child.id}
                            onClick={() => navigate(child.path)}
                            className={`
                              w-full text-left px-3 py-2 rounded-lg text-[12.5px]
                              transition-all duration-200
                              ${childActive
                                ? "text-primary font-medium bg-primary/[0.06]"
                                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                              }
                            `}
                          >
                            {child.label}
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
          <span>Thema's</span>
        </button>
        <button
          onClick={() => navigate("/instellingen")}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${
            path === "/instellingen" ? "text-foreground bg-secondary" : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
          }`}
        >
          <Settings className="w-5 h-5" />
          <span>Instellingen</span>
        </button>
        {role === "accountant" && (
          <button
            onClick={() => navigate("/audit-log")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${
              path === "/audit-log" ? "text-foreground bg-secondary" : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
            }`}
          >
            <Shield className="w-5 h-5" />
            <span>Audit Log</span>
          </button>
        )}
      </div>
    </motion.aside>
  );
}