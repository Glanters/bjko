import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { AuditLog } from "@shared/schema";

export function useAuditLogs() {
  return useQuery<AuditLog[]>({
    queryKey: ["/api/audit-logs"],
    queryFn: () => apiRequest("GET", "/api/audit-logs").then(r => r.json()),
    refetchInterval: 15000,
  });
}
