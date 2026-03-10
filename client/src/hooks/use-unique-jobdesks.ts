import { useStaff } from "./use-staff";

export function useUniqueJobdesks() {
  const { data: staffList, isLoading } = useStaff();

  const jobdesks = staffList
    ? Array.from(new Set(staffList.map(s => s.jobdesk))).sort()
    : [];

  return { jobdesks, isLoading };
}
