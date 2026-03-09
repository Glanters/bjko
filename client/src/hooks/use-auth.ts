import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

type LoginInput = z.infer<typeof api.auth.login.input>;

export function useAuth() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: user, isLoading, error } = useQuery({
    queryKey: [api.auth.me.path],
    queryFn: async () => {
      const res = await fetch(api.auth.me.path, { credentials: "include" });
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Failed to fetch user");
      const data = await res.json();
      return api.auth.me.responses[200].parse(data);
    },
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginInput) => {
      const res = await fetch(api.auth.login.path, {
        method: api.auth.login.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 403) {
          throw new Error("IP tidak sesuai. Akses ditolak.");
        }
        if (res.status === 401) {
          throw new Error("Username atau password salah.");
        }
        throw new Error("Terjadi kesalahan saat login.");
      }

      const data = await res.json();
      return api.auth.login.responses[200].parse(data);
    },
    onSuccess: (data) => {
      queryClient.setQueryData([api.auth.me.path], data.user);
      setLocation("/welcome");
    },
    onError: (err: Error) => {
      toast({
        variant: "destructive",
        title: "Login Gagal",
        description: err.message,
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(api.auth.logout.path, {
        method: api.auth.logout.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to logout");
    },
    onSuccess: () => {
      queryClient.setQueryData([api.auth.me.path], null);
      setLocation("/login");
    },
  });

  return {
    user,
    isLoading,
    error,
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
}
