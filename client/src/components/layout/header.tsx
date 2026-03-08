import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LogOut, ShieldAlert, User as UserIcon, Settings as SettingsIcon,
  ArrowLeft, Sun, Moon, BarChart2, Shield, Database, Settings2,
  ChevronDown, LayoutDashboard, History as HistoryIcon, Pencil,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";

export function Header() {
  const { user, logout, isLoggingOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [location, navigate] = useLocation();

  if (!user) return null;

  const isOnDashboard = location === "/";
  const showBackButton = !isOnDashboard && location !== "/login";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
            <ShieldAlert className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg leading-tight text-gradient">
              Dashboard IZIN Staff
            </h1>
            <p className="text-xs text-muted-foreground font-medium">BOSJOKO</p>
          </div>
        </div>

        {/* Nav */}
        <div className="flex items-center gap-1 overflow-x-auto">
          {showBackButton && (
            <Button
              variant="ghost" size="sm"
              onClick={() => navigate("/")}
              className="text-muted-foreground hover:text-primary rounded-full px-3"
              data-testid="button-back"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Kembali
            </Button>
          )}

          {/* Theme Toggle */}
          <Button
            variant="ghost" size="sm"
            onClick={toggleTheme}
            className="text-muted-foreground hover:text-primary rounded-full px-2.5"
            data-testid="button-theme-toggle"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>

          {/* User Badge */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 border border-white/5">
            <UserIcon className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">{user.username}</span>
            <Badge variant="outline" className="text-xs uppercase bg-background">{user.role}</Badge>
          </div>

          {/* Dashboard */}
          <Button
            variant={location === "/" ? "secondary" : "ghost"} size="sm"
            onClick={() => navigate("/")}
            className="text-muted-foreground hover:text-primary rounded-full px-3"
            data-testid="button-dashboard"
          >
            <LayoutDashboard className="w-4 h-4 mr-1.5" />
            Dashboard
          </Button>

          {/* Riwayat */}
          <Button
            variant={location === "/history" ? "secondary" : "ghost"} size="sm"
            onClick={() => navigate("/history")}
            className="text-muted-foreground hover:text-primary rounded-full px-3"
            data-testid="button-history"
          >
            <HistoryIcon className="w-4 h-4 mr-1.5" />
            Riwayat
          </Button>

          {/* Master Dropdown - Admin Only */}
          {user.role === "admin" && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost" size="sm"
                  className="text-muted-foreground hover:text-primary rounded-full px-3"
                  data-testid="button-master-menu"
                >
                  Master
                  <ChevronDown className="w-3.5 h-3.5 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="text-xs text-muted-foreground">Menu Admin</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/analytics")} data-testid="menu-analytics">
                  <BarChart2 className="w-4 h-4 mr-2 text-primary" />
                  Dashboard Analytics
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/")} data-testid="menu-edit-staff">
                  <Pencil className="w-4 h-4 mr-2 text-blue-400" />
                  Edit Staff Data
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/leave-rules")} data-testid="menu-leave-rules">
                  <Settings2 className="w-4 h-4 mr-2 text-purple-400" />
                  Peraturan Izin Dinamis
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/audit-log")} data-testid="menu-audit-log">
                  <Shield className="w-4 h-4 mr-2 text-green-400" />
                  Audit Log
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/backup")} data-testid="menu-backup">
                  <Database className="w-4 h-4 mr-2 text-yellow-400" />
                  Data Sync & Backup
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/settings")} data-testid="menu-settings">
                  <SettingsIcon className="w-4 h-4 mr-2" />
                  Pengaturan
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Logout */}
          <Button
            variant="ghost" size="sm"
            onClick={() => logout()}
            disabled={isLoggingOut}
            className="text-muted-foreground hover:text-red-400 hover:bg-red-400/10 rounded-full px-3"
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4 mr-1.5" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
