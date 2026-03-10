import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

type InsertStaffInput = z.infer<typeof api.staff.create.input>;

export function useStaff() {
  return useQuery({
    queryKey: [api.staff.list.path],
    queryFn: async () => {
      const res = await fetch(api.staff.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch staff");
      const data = await res.json();
      return api.staff.list.responses[200].parse(data);
    },
    // Refetch every second to keep dashboards in sync
    refetchInterval: 1000, 
  });
}

export function useCreateStaff() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertStaffInput) => {
      const res = await fetch(api.staff.create.path, {
        method: api.staff.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 403) throw new Error("Anda tidak memiliki akses (Admin only).");
        throw new Error("Gagal menambahkan staff.");
      }

      const responseData = await res.json();
      return api.staff.create.responses[201].parse(responseData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.staff.list.path] });
      toast({
        title: "Berhasil",
        description: "Staff baru berhasil ditambahkan.",
      });
    },
    onError: (err: Error) => {
      toast({
        variant: "destructive",
        title: "Gagal",
        description: err.message,
      });
    },
  });
}

export function useUpdateStaffJobdesk() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, jobdesk }: { id: number; jobdesk: string }) => {
      const res = await apiRequest("PATCH", `/api/staff/${id}/jobdesk`, { jobdesk });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.staff.list.path] });
      toast({ title: "Berhasil", description: "Jobdesk staff berhasil diperbarui." });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Gagal", description: "Gagal memperbarui jobdesk." });
    },
  });
}

export function useUpdateStaffCutiStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string | null }) => {
      const res = await apiRequest("PATCH", `/api/staff/${id}/cuti-status`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.staff.list.path] });
      toast({ title: "Berhasil", description: "Status cuti berhasil diperbarui." });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Gagal", description: "Gagal memperbarui status cuti." });
    },
  });
}
