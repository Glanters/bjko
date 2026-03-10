import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useCreateStaff } from "@/hooks/use-staff";
import { useUniqueJobdesks } from "@/hooks/use-unique-jobdesks";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Users, Check, Lock, ShieldCheck } from "lucide-react";
import type { StaffPermission } from "@shared/schema";

const STAFF_ROLES = ["agent", "admin", "supervisor", "leader"] as const;

const staffFormSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  jobdesk: z.string().min(1, "Jobdesk wajib dipilih"),
  role: z.string().default("agent"),
  shift: z.string().default("PAGI"),
});

type StaffForm = z.infer<typeof staffFormSchema>;

export function AddStaffDialog() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const { mutate: createStaff, isPending } = useCreateStaff();
  const { jobdesks, isLoading: jobdesksLoading } = useUniqueJobdesks();
  const [isNewJobdesk, setIsNewJobdesk] = useState(false);
  const [newJobdeskValue, setNewJobdeskValue] = useState("");
  const [extraJobdesks, setExtraJobdesks] = useState<string[]>([]);

  const { data: myPerm } = useQuery<StaffPermission | null>({
    queryKey: ["/api/permissions/me"],
    enabled: user?.role === "agent",
  });

  const isAdmin = user?.role === "admin";
  const canAdd = isAdmin || (myPerm?.canAddStaff === true);

  const allowedJobdesks = isAdmin
    ? null
    : (myPerm?.allowedJobdesks ? myPerm.allowedJobdesks.split(",").filter(Boolean) : []);

  const form = useForm<StaffForm>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: {
      name: "",
      jobdesk: "",
      role: "agent",
      shift: "PAGI",
    },
  });

  function onSubmit(data: StaffForm) {
    createStaff(data as any, {
      onSuccess: () => {
        form.reset();
        setOpen(false);
        setIsNewJobdesk(false);
        setNewJobdeskValue("");
      },
    });
  }

  const handleJobdeskChange = (value: string) => {
    if (value === "new") {
      setIsNewJobdesk(true);
      setNewJobdeskValue("");
      form.setValue("jobdesk", "");
    } else {
      setIsNewJobdesk(false);
      form.setValue("jobdesk", value);
    }
  };

  const handleConfirmNewJobdesk = () => {
    const trimmed = newJobdeskValue.trim();
    if (!trimmed) return;
    if (!extraJobdesks.includes(trimmed) && !jobdesks.includes(trimmed)) {
      setExtraJobdesks(prev => [...prev, trimmed]);
    }
    form.setValue("jobdesk", trimmed);
    setIsNewJobdesk(false);
    setNewJobdeskValue("");
  };

  const baseJobdesks = allowedJobdesks !== null ? allowedJobdesks : jobdesks;
  const allJobdesks = [...new Set([...baseJobdesks, ...extraJobdesks])].sort();

  if (!canAdd) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary/50 border border-white/5 text-muted-foreground text-sm">
        <Lock className="w-4 h-4" />
        Tidak ada izin tambah staff
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(val) => {
      setOpen(val);
      if (!val) {
        form.reset();
        setIsNewJobdesk(false);
        setNewJobdeskValue("");
      }
    }}>
      <DialogTrigger asChild>
        <Button className="bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40 transition-all rounded-xl">
          <Plus className="w-4 h-4 mr-2" />
          Tambah Staff
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] glass-panel border-white/10 rounded-2xl">
        <DialogHeader>
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30 mb-4">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className="text-2xl font-display text-gradient">Tambah Staff Baru</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Masukkan detail staff untuk didaftarkan ke sistem monitoring.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
            {/* Nama Lengkap */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground/80">Nama Lengkap</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Budi Santoso"
                      className="bg-background/50 border-white/10 focus-visible:ring-primary/30 rounded-xl h-11"
                      {...field}
                      data-testid="input-staff-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Role Staff — admin only */}
            {isAdmin ? (
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground/80 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-primary" />
                      Role Staff
                    </FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger
                          className="bg-background/50 border-white/10 focus:ring-primary/30 rounded-xl h-11"
                          data-testid="select-role-staff"
                        >
                          <SelectValue placeholder="Pilih role staff" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {STAFF_ROLES.map(r => (
                          <SelectItem key={r} value={r} data-testid={`role-option-${r}`}>
                            {r.charAt(0).toUpperCase() + r.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              /* Role Sistem — read-only for agent */
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/80">Role Sistem</label>
                <div
                  className="bg-background/30 border border-white/10 rounded-xl h-11 flex items-center px-3 text-sm text-muted-foreground cursor-not-allowed"
                  data-testid="input-role-sistem"
                >
                  agent
                </div>
              </div>
            )}

            {/* Jobdesk */}
            <FormField
              control={form.control}
              name="jobdesk"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground/80">Jobdesk</FormLabel>
                  {isNewJobdesk ? (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <FormControl>
                          <Input
                            placeholder="Masukkan jobdesk baru"
                            className="bg-background/50 border-white/10 focus-visible:ring-primary/30 rounded-xl h-11"
                            value={newJobdeskValue}
                            onChange={(e) => {
                              setNewJobdeskValue(e.target.value);
                              field.onChange(e.target.value);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleConfirmNewJobdesk();
                              }
                            }}
                            autoFocus
                            data-testid="input-new-jobdesk"
                          />
                        </FormControl>
                        <Button
                          type="button"
                          onClick={handleConfirmNewJobdesk}
                          disabled={!newJobdeskValue.trim()}
                          className="h-11 px-3 rounded-xl bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary shrink-0"
                          data-testid="button-confirm-new-jobdesk"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">Tekan Enter atau klik ✓ untuk menyimpan jobdesk</p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setIsNewJobdesk(false);
                          setNewJobdeskValue("");
                          form.setValue("jobdesk", "");
                        }}
                        className="h-8 text-muted-foreground"
                        data-testid="button-cancel-new-jobdesk"
                      >
                        ← Kembali ke pilihan
                      </Button>
                    </div>
                  ) : (
                    <Select
                      value={field.value}
                      onValueChange={handleJobdeskChange}
                      disabled={jobdesksLoading}
                    >
                      <FormControl>
                        <SelectTrigger
                          className="bg-background/50 border-white/10 focus:ring-primary/30 rounded-xl h-11"
                          data-testid="select-jobdesk"
                        >
                          <SelectValue placeholder="Pilih atau buat jobdesk baru" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {allJobdesks.length > 0 && (
                          <>
                            {allJobdesks.map((jobdesk) => (
                              <SelectItem key={jobdesk} value={jobdesk} data-testid={`jobdesk-option-${jobdesk}`}>
                                {jobdesk}
                              </SelectItem>
                            ))}
                            <div className="border-t border-white/10 my-2" />
                          </>
                        )}
                        {isAdmin && (
                          <SelectItem value="new" className="text-primary" data-testid="jobdesk-option-new">
                            + Tambah Jobdesk Baru
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="pt-4">
              <Button
                type="submit"
                className="w-full h-11 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold shadow-lg hover:shadow-xl transition-all"
                disabled={isPending}
                data-testid="button-submit-staff"
              >
                {isPending ? "Menyimpan..." : "Simpan Data Staff"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
