import { useStaff } from "@/hooks/use-staff";
import { useLeaves } from "@/hooks/use-leaves";
import { format } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export function LeaveChart() {
  const { data: staffList } = useStaff();
  const { data: leaves } = useLeaves();

  if (!staffList || !leaves) return null;

  const todayString = format(new Date(), "yyyy-MM-dd");
  const todaysLeaves = leaves.filter(l => l.date === todayString);

  // Aggregate leaves by staff
  const data = staffList.map(staff => {
    const count = todaysLeaves.filter(l => l.staffId === staff.id).length;
    return {
      name: staff.name,
      izin: count,
    };
  })
  .filter(item => item.izin > 0) // Only show those who took leave
  .sort((a, b) => b.izin - a.izin) // Sort descending
  .slice(0, 5); // Top 5

  return (
    <Card className="glass-panel border-0 shadow-xl overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
      <CardHeader className="pb-2 border-b border-white/5 relative z-10">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/20 text-primary">
            <BarChart3 className="w-4 h-4" />
          </div>
          <CardTitle className="text-lg font-display">Staff Paling Sering Izin (Hari Ini)</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-6 relative z-10">
        {data.length === 0 ? (
          <div className="h-[200px] flex items-center justify-center flex-col text-muted-foreground">
            <BarChart3 className="w-8 h-8 mb-2 opacity-20" />
            <p>Belum ada data izin hari ini</p>
          </div>
        ) : (
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <Tooltip 
                  cursor={{ fill: 'hsl(var(--muted)/0.5)' }}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 'bold', marginBottom: '4px' }}
                />
                <Bar dataKey="izin" radius={[4, 4, 0, 0]}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? 'hsl(var(--primary))' : 'hsl(var(--primary)/0.5)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
