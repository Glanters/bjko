import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { useStaff } from "@/hooks/use-staff";
import { useLeaves } from "@/hooks/use-leaves";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { Users, Coffee, UserCheck, ArrowRight, ClipboardList, Briefcase, UserMinus, Activity } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

function StatsCards() {
  const { data: staffList } = useStaff();
  const { data: leaves } = useLeaves();

  const totalStaff = staffList?.length ?? 0;
  const agentCount = staffList?.filter(s => s.role === "agent").length ?? 0;

  const localMidnight = new Date();
  localMidnight.setHours(0, 0, 0, 0);

  const sedangCuti = leaves?.filter(l =>
    !l.clockInTime && new Date(l.startTime) >= localMidnight
  ).length ?? 0;

  return (
    <div className="grid grid-cols-3 gap-4" data-testid="stats-cards">
      <div className="glass-panel rounded-2xl border border-white/10 p-5 flex flex-col items-center justify-center text-center hover:border-primary/20 transition-colors" data-testid="card-total-users">
        <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/20 flex items-center justify-center mb-3">
          <Users className="w-6 h-6 text-primary" />
        </div>
        <p className="text-xs font-semibold text-muted-foreground mb-1">Total Users</p>
        <p className="text-3xl font-bold text-gradient">{totalStaff}</p>
        <p className="text-[11px] text-muted-foreground mt-1">{totalStaff} Users</p>
      </div>

      <div className="glass-panel rounded-2xl border border-blue-500/20 p-5 flex flex-col items-center justify-center text-center hover:border-blue-500/30 transition-colors" data-testid="card-agent">
        <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/20 flex items-center justify-center mb-3">
          <UserCheck className="w-6 h-6 text-blue-400" />
        </div>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">AGENT</p>
        <p className="text-3xl font-bold text-blue-400">{agentCount}</p>
        <p className="text-[11px] text-muted-foreground mt-1">{agentCount} Users</p>
        <p className="text-[10px] text-muted-foreground">Kategori Role Aktif</p>
      </div>

      <div className="glass-panel rounded-2xl border border-amber-500/20 p-5 flex flex-col items-center justify-center text-center hover:border-amber-500/30 transition-colors" data-testid="card-sedang-cuti">
        <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/20 flex items-center justify-center mb-3">
          <Coffee className="w-6 h-6 text-amber-400" />
        </div>
        <p className="text-xs font-semibold text-muted-foreground mb-1">Sedang Cuti</p>
        <p className="text-3xl font-bold text-amber-400">{sedangCuti}</p>
        <p className="text-[11px] text-muted-foreground mt-1">{sedangCuti} Users</p>
      </div>
    </div>
  );
}

interface QuickCard {
  title: string;
  desc: string;
  icon: React.ReactNode;
  href: string;
  color: string;
  borderColor: string;
  testId: string;
}

function QuickNav() {
  const [, navigate] = useLocation();

  const cards: QuickCard[] = [
    {
      title: "Izin Staff",
      desc: "Monitor dan kelola izin staff secara real-time",
      icon: <ClipboardList className="w-7 h-7" />,
      href: "/izin",
      color: "text-primary",
      borderColor: "border-primary/20 hover:border-primary/50 hover:bg-primary/5",
      testId: "quick-izin-staff",
    },
    {
      title: "Jobdesk Staff",
      desc: "Lihat daftar jobdesk per shift PAGI / SORE / MALAM",
      icon: <Briefcase className="w-7 h-7" />,
      href: "/jobdesk",
      color: "text-yellow-400",
      borderColor: "border-yellow-500/20 hover:border-yellow-500/50 hover:bg-yellow-500/5",
      testId: "quick-jobdesk",
    },
    {
      title: "Riwayat Izin",
      desc: "Lihat history izin dan staff yang sedang cuti",
      icon: <UserMinus className="w-7 h-7" />,
      href: "/history",
      color: "text-rose-400",
      borderColor: "border-rose-500/20 hover:border-rose-500/50 hover:bg-rose-500/5",
      testId: "quick-history",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {cards.map(c => (
        <button
          key={c.href}
          onClick={() => navigate(c.href)}
          className={`glass-panel rounded-2xl border ${c.borderColor} p-5 text-left group transition-all`}
          data-testid={c.testId}
        >
          <div className="flex items-start justify-between mb-4">
            <div className={`${c.color} opacity-80 group-hover:opacity-100 transition-opacity`}>
              {c.icon}
            </div>
            <ArrowRight className={`w-4 h-4 ${c.color} opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all`} />
          </div>
          <h3 className={`font-bold text-base mb-1 ${c.color}`}>{c.title}</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">{c.desc}</p>
        </button>
      ))}
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const today = format(new Date(), "EEEE, dd MMMM yyyy", { locale: localeId });

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background flex relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/10 blur-[120px] pointer-events-none" />

      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        <main className="flex-1 overflow-auto px-4 py-8 relative z-10">
          {/* Welcome hero */}
          <div className="glass-panel rounded-3xl border border-white/10 px-8 py-8 mb-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 pointer-events-none" />
            <div className="relative z-10">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-widest mb-3">{today}</p>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-4xl">👋</span>
                <h1 className="text-3xl md:text-4xl font-display font-black text-gradient tracking-wide">
                  Selamat Datang, <span className="uppercase">{user.username}</span>!
                </h1>
              </div>
              <div className="flex items-center gap-3 mt-3">
                <Badge
                  variant="outline"
                  className="uppercase text-xs font-bold tracking-wide border-primary/40 text-primary bg-primary/10 px-3 py-1"
                  data-testid="badge-role-home"
                >
                  {user.role}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Dashboard Operasional BOSJOKO · Pilih menu di bawah untuk memulai.
                </span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Statistik Hari Ini
            </h2>
            <StatsCards />
          </div>

          {/* Quick nav */}
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
              <ArrowRight className="w-4 h-4" />
              Menu Utama
            </h2>
            <QuickNav />
          </div>
        </main>
      </div>
    </div>
  );
}
