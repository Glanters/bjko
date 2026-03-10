import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@shared/routes";
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
import { Plus, Users, Check } from "lucide-react";

type InsertStaffForm = z.infer<typeof api.staff.create.input>;

export function AddStaffDialog() {
  const [open, setOpen] = useState(false);
  const { mutate: createStaff, isPending } = useCreateStaff();
  const { jobdesks, isLoading: jobdesksLoading } = useUniqueJobdesks();
  const [isNewJobdesk, setIsNewJobdesk] = useState(false);
  const [newJobdeskValue, setNewJobdeskValue] = useState("");
  const [extraJobdesks, setExtraJobdesks] = useState<string[]>([]);

  const form = useForm<InsertStaffForm>({
    resolver: zodResolver(api.staff.create.input),
    defaultValues: {
      name: "",
      jobdesk: "",
      role: "agent",
    },
  });

  function onSubmit(data: InsertStaffForm) {
    createStaff(data, {
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

  const allJobdesks = [...new Set([...jobdesks, ...extraJobdesks])].sort();

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
                        <SelectTrigger className="bg-background/50 border-white/10 focus:ring-primary/30 rounded-xl h-11" data-testid="select-jobdesk">
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
                        <SelectItem value="new" className="text-primary" data-testid="jobdesk-option-new">
                          + Tambah Jobdesk Baru
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground/80">Role Sistem</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g. agent" 
                      className="bg-background/50 border-white/10 focus-visible:ring-primary/30 rounded-xl h-11"
                      disabled
                      {...field} 
                      data-testid="input-role"
                    />
                  </FormControl>
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
