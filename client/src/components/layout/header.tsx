import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { LogOut, ShieldAlert, User as UserIcon, Settings as SettingsIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";

export function Header() {
  const { user, logout, isLoggingOut } = useAuth();
  const [, navigate] = useLocation();

  if (!user) return null;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
            <ShieldAlert className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg leading-tight text-gradient">
              Dashboard IZIN Staff
            </h1>
            <p className="text-xs text-muted-foreground font-medium">
              BOSJOKO
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-3 px-4 py-1.5 rounded-full bg-secondary/50 border border-white/5">
            <UserIcon className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">{user.username}</span>
            <Badge variant="outline" className="text-xs uppercase bg-background">
              {user.role}
            </Badge>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/history")}
            className="text-muted-foreground hover:text-primary transition-colors rounded-full px-4"
            data-testid="button-history"
          >
            Riwayat
          </Button>
          
          {user.role === "admin" && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate("/settings")}
              className="text-muted-foreground hover:text-primary transition-colors rounded-full px-4"
              data-testid="button-settings"
            >
              <SettingsIcon className="w-4 h-4 mr-2" />
              Pengaturan
            </Button>
          )}
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => logout()}
            disabled={isLoggingOut}
            className="text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors rounded-full px-4"
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
