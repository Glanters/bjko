import { useQuery } from "@tanstack/react-query";
import type { Staff } from "@shared/schema";

export function useUniqueJobdesks() {
  const query = useQuery({
    queryKey: ["/api/staff"],
    queryFn: () =>
      fetch("/api/staff", { credentials: "include" })
        .then(r => r.json())
        .then((staffList: Staff[]) => {
          const unique = [...new Set(staffList.map(s => s.jobdesk))];
          return unique.sort();
        }),
    staleTime: 0,
  });

  return {
    jobdesks: query.data ?? [],
    isLoading: query.isLoading,
  };
}
