import { Header } from "@/components/layout/header";
import { useAnalytics } from "@/hooks/use-analytics";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { TrendingUp, Users, Clock, CheckCircle, XCircle, AlertCircle, BarChart2, Activity } from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";

const COLORS = ["#3b82f6", "#06b6d4", "#8b5cf6", "#f59e0b", "#10b981"];

export default function Analytics() {
  const { user } = useAuth();
  const { data, isLoading } = useAnalytics();

  if (!user) return null;

  const onTimePct = data && (data.onTimeCount + data.lateCount) > 0
    ? Math.round((data.onTimeCount / (data.onTimeCount + data.lateCount)) * 100)
    : 0;

  const pieData = data ? [
    { name: "Tepat Waktu", value: data.onTimeCount },
    { name: "Terlambat", value: data.lateCount },
    { name: "Belum Check In", value: data.pendingCount },
  ].filter(d => d.value > 0) : [];

  const jobdeskData = data
    ? Object.entries(data.leavesByJobdesk).map(([name, value]) => ({ name, value }))
    : [];

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/10 blur-[120px] pointer-events-none" />

      <Header />

      <main className="flex-1 container mx-auto px-4 py-8 relative z-10">
        <div className="mb-8">
          <h2 className="text-3xl font-display font-bold text-gradient flex items-center gap-2">
            <BarChart2 className="w-8 h-8 text-primary" />
            Dashboard Analytics
          </h2>
          <p className="text-muted-foreground mt-2">Statistik dan analisa data izin staff secara menyeluruh</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : !data ? (
          <div className="text-center text-muted-foreground py-20">Gagal memuat data analytics</div>
        ) : (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="glass-panel border-0">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Activity className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-sm text-muted-foreground">Izin Hari Ini</span>
                  </div>
                  <p className="text-3xl font-bold" data-testid="stat-today-count">{data.todayCount}</p>
                </CardContent>
              </Card>
              <Card className="glass-panel border-0">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-cyan-400" />
                    </div>
                    <span className="text-sm text-muted-foreground">Total Semua</span>
                  </div>
                  <p className="text-3xl font-bold" data-testid="stat-total-count">{data.totalCount}</p>
                </CardContent>
              </Card>
              <Card className="glass-panel border-0">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    </div>
                    <span className="text-sm text-muted-foreground">Tepat Waktu</span>
                  </div>
                  <p className="text-3xl font-bold text-green-400">{onTimePct}%</p>
                </CardContent>
              </Card>
              <Card className="glass-panel border-0">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                      <AlertCircle className="w-4 h-4 text-yellow-400" />
                    </div>
                    <span className="text-sm text-muted-foreground">Belum Check In</span>
                  </div>
                  <p className="text-3xl font-bold text-yellow-400">{data.pendingCount}</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 7-day Trend */}
              <Card className="glass-panel border-0">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Tren Izin 7 Hari Terakhir</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={data.last7Days}>
                      <XAxis dataKey="date" tickFormatter={d => format(parseISO(d), "dd/MM")} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                      <Tooltip
                        labelFormatter={d => format(parseISO(String(d)), "dd MMM yyyy", { locale: idLocale })}
                        formatter={(v: any) => [v, "Izin"]}
                        contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                      />
                      <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4, fill: "#3b82f6" }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Status Pie */}
              <Card className="glass-panel border-0">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Status Izin Keseluruhan</CardTitle>
                </CardHeader>
                <CardContent>
                  {pieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" outerRadius={75} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                          {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(v: any) => [v, "Izin"]} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">Belum ada data</div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Izin per Jobdesk (Today) */}
              <Card className="glass-panel border-0">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Izin Per Jabatan (Hari Ini)</CardTitle>
                </CardHeader>
                <CardContent>
                  {jobdeskData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={jobdeskData} layout="vertical">
                        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                        <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                        <Tooltip formatter={(v: any) => [v, "Izin"]} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                        <Bar dataKey="value" fill="#3b82f6" radius={[0, 6, 6, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">Belum ada izin hari ini</div>
                  )}
                </CardContent>
              </Card>

              {/* Top 5 Staff */}
              <Card className="glass-panel border-0">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Top 5 Staff Terbanyak Izin</CardTitle>
                </CardHeader>
                <CardContent>
                  {data.top5Staff.length > 0 ? (
                    <div className="space-y-3">
                      {data.top5Staff.map((s, i) => (
                        <div key={s.staffId} className="flex items-center gap-3" data-testid={`top-staff-${s.staffId}`}>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-yellow-500/20 text-yellow-400' : i === 1 ? 'bg-slate-400/20 text-slate-300' : 'bg-amber-700/20 text-amber-600'}`}>
                            {i + 1}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{s.name}</p>
                            <p className="text-xs text-muted-foreground">{s.jobdesk}</p>
                          </div>
                          <Badge variant="outline" className="text-xs">{s.count}x</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-[160px] text-muted-foreground text-sm">Belum ada data</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
