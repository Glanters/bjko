import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  LayoutDashboard, ChevronDown, ChevronRight,
  Coffee, Briefcase, UserMinus, History,
  Settings, BarChart2, Shield, Database, Settings2, ShieldCheck, ClipboardList,
} from "lucide-react";
import bosjokoLogo from "@assets/image_1773044190239.png";

export function Sidebar() {
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const [staffMenuOpen, setStaffMenuOpen] = useState(
    ["/izin", "/jobdesk", "/staff-cuti"].includes(location)
  );

  if (!user) return null;

  const isActive = (href: string) => location === href;
  const isStaffMenuActive = ["/izin", "/jobdesk", "/staff-cuti"].includes(location);

  return (
    <aside className="hidden md:flex flex-col w-56 shrink-0 border-r border-white/5 bg-background/95 backdrop-blur-xl h-screen sticky top-0 overflow-y-auto">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/5">
        <div className="w-9 h-9 rounded-xl overflow-hidden border border-white/10 shrink-0">
          <img src={bosjokoLogo} alt="Logo" className="w-full h-full object-cover" />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-sm leading-tight text-gradient truncate">Dashboard Operasional</p>
          <p className="text-[10px] text-muted-foreground font-medium">BOSJOKO</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {/* Dashboard (Home) */}
        <button
          onClick={() => navigate("/")}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
            isActive("/")
              ? "bg-primary/20 text-primary border border-primary/20"
              : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
          }`}
          data-testid="sidebar-dashboard"
        >
          <LayoutDashboard className="w-4 h-4 shrink-0" />
          Dashboard
        </button>

        {/* Staff & Izin Dropdown */}
        <div>
          <button
            onClick={() => setStaffMenuOpen(prev => !prev)}
            className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              isStaffMenuActive || staffMenuOpen
                ? "bg-white/5 text-foreground"
                : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
            }`}
            data-testid="sidebar-staff-dropdown"
          >
            <span className="flex items-center gap-3">
              <Briefcase className="w-4 h-4 shrink-0" />
              Staff & Izin
            </span>
            {staffMenuOpen ? (
              <ChevronDown className="w-3.5 h-3.5 shrink-0" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            )}
          </button>

          {staffMenuOpen && (
            <div className="mt-1 ml-3 pl-3 border-l border-white/10 space-y-0.5">
              <button
                onClick={() => navigate("/izin")}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive("/izin")
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                }`}
                data-testid="sidebar-izin-staff"
              >
                <ClipboardList className="w-3.5 h-3.5 shrink-0" />
                Izin Staff
              </button>
              <button
                onClick={() => navigate("/jobdesk")}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive("/jobdesk")
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                }`}
                data-testid="sidebar-jobdesk-staff"
              >
                <Briefcase className="w-3.5 h-3.5 shrink-0" />
                Jobdesk Staff
              </button>
              <button
                onClick={() => navigate("/staff-cuti")}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive("/staff-cuti")
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                }`}
                data-testid="sidebar-staff-cuti"
              >
                <UserMinus className="w-3.5 h-3.5 shrink-0" />
                Staff Cuti
              </button>
            </div>
          )}
        </div>

        {/* Riwayat Izin */}
        <button
          onClick={() => navigate("/history")}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
            isActive("/history")
              ? "bg-primary/20 text-primary border border-primary/20"
              : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
          }`}
          data-testid="sidebar-history"
        >
          <History className="w-4 h-4 shrink-0" />
          Riwayat Izin
        </button>

        {/* Admin Only */}
        {user.role === "admin" && (
          <>
            <div className="pt-3 pb-1">
              <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider font-semibold px-3">Admin</p>
            </div>
            <button
              onClick={() => navigate("/analytics")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive("/analytics")
                  ? "bg-primary/20 text-primary border border-primary/20"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              }`}
              data-testid="sidebar-analytics"
            >
              <BarChart2 className="w-4 h-4 shrink-0" />
              Analytics
            </button>
            <button
              onClick={() => navigate("/audit-log")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive("/audit-log")
                  ? "bg-primary/20 text-primary border border-primary/20"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              }`}
              data-testid="sidebar-audit"
            >
              <Shield className="w-4 h-4 shrink-0" />
              Audit Log
            </button>
            <button
              onClick={() => navigate("/leave-rules")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive("/leave-rules")
                  ? "bg-primary/20 text-primary border border-primary/20"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              }`}
              data-testid="sidebar-leave-rules"
            >
              <Settings2 className="w-4 h-4 shrink-0" />
              Peraturan Izin
            </button>
            <button
              onClick={() => navigate("/backup")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive("/backup")
                  ? "bg-primary/20 text-primary border border-primary/20"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              }`}
              data-testid="sidebar-backup"
            >
              <Database className="w-4 h-4 shrink-0" />
              Backup Data
            </button>
            <button
              onClick={() => navigate("/permissions")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive("/permissions")
                  ? "bg-primary/20 text-primary border border-primary/20"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              }`}
              data-testid="sidebar-permissions"
            >
              <ShieldCheck className="w-4 h-4 shrink-0" />
              Izin Edit Staff
            </button>
            <button
              onClick={() => navigate("/settings")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive("/settings")
                  ? "bg-primary/20 text-primary border border-primary/20"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              }`}
              data-testid="sidebar-settings"
            >
              <Settings className="w-4 h-4 shrink-0" />
              Pengaturan
            </button>
          </>
        )}
      </nav>
    </aside>
  );
}
