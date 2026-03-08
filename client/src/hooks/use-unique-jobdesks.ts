import { useEffect, useState } from "react";
import type { Staff } from "@shared/schema";

export function useUniqueJobdesks() {
  const [jobdesks, setJobdesks] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/staff", { credentials: "include" })
      .then(r => r.json())
      .then((staffList: Staff[]) => {
        const unique = [...new Set(staffList.map(s => s.jobdesk))];
        setJobdesks(unique.sort());
      })
      .finally(() => setIsLoading(false));
  }, []);

  return { jobdesks, isLoading };
}
