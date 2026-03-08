import { Header } from "@/components/layout/header";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Settings2, Clock, Calendar, Users, Save } from "lucide-react";
import { useState, useEffect } from "react";
import { useLeaveSettings, useUpdateLeaveSetting } from "@/hooks/use-leave-settings";
import { useJobdeskLimits, useUpdateJobdeskLimits } from "@/hooks/use-jobdesk-limits";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

export default function LeaveRules() {
  const { user } = useAuth();
  const { data: settings, isLoading: loadingSettings } = useLeaveSettings();
  const { mutate: updateSetting, isPending: updatingSetting } = useUpdateLeaveSetting();
  const { data: limitsData } = useJobdeskLimits();
  const { mutate: updateLimits, isPending: updatingLimits } = useUpdateJobdeskLimits();

  const [maxLeavesPerDay, setMaxLeavesPerDay] = useState(4);
  const [leaveDurationMinutes, setLeaveDurationMinutes] = useState(15);
  const [jobdeskLimitsText, setJobdeskLimitsText] = useState("");

  useEffect(() => {
    if (settings) {
      if (settings.max_leaves_per_day) setMaxLeavesPerDay(Number(settings.max_leaves_per_day));
      if (settings.leave_duration_minutes) setLeaveDurationMinutes(Number(settings.leave_duration_minutes));
    }
  }, [settings]);

  useEffect(() => {
    if (limitsData?.limits) {
      const text = Object.entries(limitsData.limits)
        .map(([jobdesk, limit]) => `${jobdesk}=${limit}`)
        .join("\n");
      setJobdeskLimitsText(text);
    }
  }, [limitsData]);

  const handleSaveMaxLeaves = () => {
    updateSetting({ key: "max_leaves_per_day", value: String(maxLeavesPerDay) });
  };

  const handleSaveDuration = () => {
    updateSetting({ key: "leave_duration_minutes", value: String(leaveDurationMinutes) });
  };

  const handleSaveJobdeskLimits = () => {
    const limits: Record<string, number> = {};
    jobdeskLimitsText.split("\n").forEach(line => {
      const [jobdesk, limitStr] = line.split("=");
      if (jobdesk && limitStr) limits[jobdesk.trim()] = parseInt(limitStr.trim());
    });
    updateLimits(limits);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/10 blur-[120px] pointer-events-none" />

      <Header />

      <main className="flex-1 container mx-auto px-4 py-8 relative z-10 max-w-4xl">
        <div className="mb-8">
          <h2 className="text-3xl font-display font-bold text-gradient flex items-center gap-2">
            <Settings2 className="w-8 h-8 text-primary" />
            Peraturan Izin Dinamis
          </h2>
          <p className="text-muted-foreground mt-2">Atur batas, durasi, dan ketentuan izin staff secara fleksibel</p>
        </div>

        {loadingSettings ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Max Izin Per Hari */}
            <Card className="glass-panel border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Maksimal Izin Per Hari
                </CardTitle>
                <CardDescription>
                  Tentukan berapa kali maksimal seorang staff dapat mengambil izin dalam satu hari
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Jumlah izin per hari</Label>
                    <span className="text-2xl font-bold text-primary" data-testid="value-max-leaves">{maxLeavesPerDay}x</span>
                  </div>
                  <Slider
                    value={[maxLeavesPerDay]}
                    onValueChange={([v]) => setMaxLeavesPerDay(v)}
                    min={1}
                    max={10}
                    step={1}
                    className="w-full"
                    data-testid="slider-max-leaves"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1x</span>
                    <span>5x</span>
                    <span>10x</span>
                  </div>
                </div>
                <Button onClick={handleSaveMaxLeaves} disabled={updatingSetting} data-testid="button-save-max-leaves">
                  <Save className="w-4 h-4 mr-2" />
                  {updatingSetting ? "Menyimpan..." : "Simpan"}
                </Button>
              </CardContent>
            </Card>

            {/* Durasi Izin */}
            <Card className="glass-panel border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-cyan-400" />
                  Durasi Izin (Menit)
                </CardTitle>
                <CardDescription>
                  Tentukan durasi standar izin yang diberikan kepada setiap staff
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Durasi izin</Label>
                    <span className="text-2xl font-bold text-cyan-400" data-testid="value-duration">{leaveDurationMinutes} menit</span>
                  </div>
                  <Slider
                    value={[leaveDurationMinutes]}
                    onValueChange={([v]) => setLeaveDurationMinutes(v)}
                    min={5}
                    max={60}
                    step={5}
                    className="w-full"
                    data-testid="slider-duration"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>5 mnt</span>
                    <span>30 mnt</span>
                    <span>60 mnt</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Catatan: Perubahan durasi ini bersifat informasi. Timer 15 menit di dashboard perlu penyesuaian kode terpisah.
                  </p>
                </div>
                <Button onClick={handleSaveDuration} disabled={updatingSetting} data-testid="button-save-duration">
                  <Save className="w-4 h-4 mr-2" />
                  {updatingSetting ? "Menyimpan..." : "Simpan"}
                </Button>
              </CardContent>
            </Card>

            {/* Limit Concurrent Per Jobdesk */}
            <Card className="glass-panel border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-400" />
                  Limit Bersamaan Per Jobdesk
                </CardTitle>
                <CardDescription>
                  Atur maksimal staff yang boleh izin bersamaan per jobdesk (format: JOBDESK=angka, satu per baris)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={jobdeskLimitsText}
                  onChange={(e) => setJobdeskLimitsText(e.target.value)}
                  placeholder="CS LINE=2&#10;CS=2&#10;KAPTEN=1&#10;KASIR=2"
                  className="font-mono min-h-[140px]"
                  data-testid="textarea-jobdesk-limits"
                />
                <p className="text-xs text-muted-foreground">
                  Contoh: CS LINE=2 artinya maksimal 2 staff CS LINE boleh izin bersamaan
                </p>
                <Button onClick={handleSaveJobdeskLimits} disabled={updatingLimits} data-testid="button-save-jobdesk-limits">
                  <Save className="w-4 h-4 mr-2" />
                  {updatingLimits ? "Menyimpan..." : "Simpan Limit"}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
