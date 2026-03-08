import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@shared/routes";
import { useCreateStaff } from "@/hooks/use-staff";
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
import { Plus, Users } from "lucide-react";

type InsertStaffForm = z.infer<typeof api.staff.create.input>;

export function AddStaffDialog() {
  const [open, setOpen] = useState(false);
  const { mutate: createStaff, isPending } = useCreateStaff();

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
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
                  <FormControl>
                    <Input 
                      placeholder="e.g. Customer Service" 
                      className="bg-background/50 border-white/10 focus-visible:ring-primary/30 rounded-xl h-11" 
                      {...field} 
                    />
                  </FormControl>
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
                      {...field} 
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
