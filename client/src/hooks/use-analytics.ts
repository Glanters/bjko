import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface AnalyticsData {
  todayCount: number;
  totalCount: number;
  last7Days: { date: string; count: number }[];
  leavesByJobdesk: Record<string, number>;
  top5Staff: { staffId: number; name: string; jobdesk: string; count: number }[];
  onTimeCount: number;
  lateCount: number;
  pendingCount: number;
}

export function useAnalytics() {
  return useQuery<AnalyticsData>({
    queryKey: ["/api/analytics"],
    queryFn: () => apiRequest("GET", "/api/analytics").then(r => r.json()),
    refetchInterval: 30000,
  });
}
