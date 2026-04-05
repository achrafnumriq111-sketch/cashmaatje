import {
  LayoutDashboard,
  ArrowLeftRight,
  FileText,
  GitMerge,
  Upload,
  Receipt,
  BarChart3,
  Users,
  BookOpen,
  ScrollText,
  Settings,
  Shield,
  ChevronDown,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { AuthLogo } from "@/components/AuthLogo";
import type { Database } from "@/integrations/supabase/types";

type UserRole = Database["public"]["Enums"]["user_role"];

interface AppSidebarProps {
  role?: UserRole;
}

const mainNav = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Transacties", url: "/transacties", icon: ArrowLeftRight },
];

const invoicesSub = [
  { title: "Verkoop", url: "/facturen/verkoop" },
  { title: "Inkoop", url: "/facturen/inkoop" },
];

const vatSub = [
  { title: "Aangifte", url: "/btw/aangifte" },
  { title: "ICP Opgaaf", url: "/btw/icp" },
];

const reportsSub = [
  { title: "Winst & Verlies", url: "/rapporten/winst-verlies" },
  { title: "Balans", url: "/rapporten/balans" },
  { title: "Proefbalans", url: "/rapporten/proefbalans" },
  { title: "Cashflow", url: "/rapporten/cashflow" },
];

const bottomNav = [
  { title: "Reconciliatie", url: "/reconciliatie", icon: GitMerge },
  { title: "Documenten", url: "/documenten", icon: Upload },
];

const afterReports = [
  { title: "Relaties", url: "/relaties", icon: Users },
  { title: "Grootboek", url: "/grootboek", icon: BookOpen },
  { title: "Journaalposten", url: "/journaalposten", icon: ScrollText },
];

export function AppSidebar({ role }: AppSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const path = location.pathname;

  const linkClass =
    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent/10 hover:text-foreground";
  const activeClass = "bg-primary/10 text-primary";

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4">
        {!collapsed && <AuthLogo />}
        {collapsed && (
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary-foreground">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
        )}
      </div>

      <SidebarContent className="px-2 py-3">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={linkClass} activeClassName={activeClass}>
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {/* Facturen submenu */}
              <Collapsible defaultOpen={path.startsWith("/facturen")}>
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton className={`${linkClass} w-full justify-between cursor-pointer`}>
                      <span className="flex items-center gap-3">
                        <FileText className="h-4 w-4 shrink-0" />
                        {!collapsed && <span>Facturen</span>}
                      </span>
                      {!collapsed && <ChevronDown className="h-3.5 w-3.5 transition-transform [[data-state=open]>&]:rotate-180" />}
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  {!collapsed && (
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {invoicesSub.map((sub) => (
                          <SidebarMenuSubItem key={sub.url}>
                            <SidebarMenuSubButton asChild>
                              <NavLink to={sub.url} className="text-sm text-sidebar-foreground hover:text-foreground" activeClassName="text-primary">
                                {sub.title}
                              </NavLink>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  )}
                </SidebarMenuItem>
              </Collapsible>

              {bottomNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={linkClass} activeClassName={activeClass}>
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {/* BTW submenu */}
              <Collapsible defaultOpen={path.startsWith("/btw")}>
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton className={`${linkClass} w-full justify-between cursor-pointer`}>
                      <span className="flex items-center gap-3">
                        <Receipt className="h-4 w-4 shrink-0" />
                        {!collapsed && <span>BTW</span>}
                      </span>
                      {!collapsed && <ChevronDown className="h-3.5 w-3.5 transition-transform [[data-state=open]>&]:rotate-180" />}
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  {!collapsed && (
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {vatSub.map((sub) => (
                          <SidebarMenuSubItem key={sub.url}>
                            <SidebarMenuSubButton asChild>
                              <NavLink to={sub.url} className="text-sm text-sidebar-foreground hover:text-foreground" activeClassName="text-primary">
                                {sub.title}
                              </NavLink>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  )}
                </SidebarMenuItem>
              </Collapsible>

              {/* Rapporten submenu */}
              <Collapsible defaultOpen={path.startsWith("/rapporten")}>
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton className={`${linkClass} w-full justify-between cursor-pointer`}>
                      <span className="flex items-center gap-3">
                        <BarChart3 className="h-4 w-4 shrink-0" />
                        {!collapsed && <span>Rapporten</span>}
                      </span>
                      {!collapsed && <ChevronDown className="h-3.5 w-3.5 transition-transform [[data-state=open]>&]:rotate-180" />}
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  {!collapsed && (
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {reportsSub.map((sub) => (
                          <SidebarMenuSubItem key={sub.url}>
                            <SidebarMenuSubButton asChild>
                              <NavLink to={sub.url} className="text-sm text-sidebar-foreground hover:text-foreground" activeClassName="text-primary">
                                {sub.title}
                              </NavLink>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  )}
                </SidebarMenuItem>
              </Collapsible>

              {afterReports.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={linkClass} activeClassName={activeClass}>
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border px-2 py-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink to="/instellingen" className={linkClass} activeClassName={activeClass}>
                <Settings className="h-4 w-4 shrink-0" />
                {!collapsed && <span>Instellingen</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {role === "accountant" && (
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <NavLink to="/audit-log" className={linkClass} activeClassName={activeClass}>
                  <Shield className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>Audit Log</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
