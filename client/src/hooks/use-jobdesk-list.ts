import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const KEY = "/api/jobdeskList";

export function useJobdeskMasterList() {
  return useQuery<{ jobdesks: string[] }>({ queryKey: [KEY] });
}

export function useAddJobdeskToMaster() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => apiRequest("POST", KEY, { name }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useDeleteJobdeskFromMaster() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (name: string) => apiRequest("DELETE", `${KEY}/${encodeURIComponent(name)}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      toast({ title: "Jabatan dihapus dari daftar" });
    },
    onError: () => toast({ variant: "destructive", title: "Gagal menghapus jabatan" }),
  });
}
