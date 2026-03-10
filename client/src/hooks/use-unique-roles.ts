import { useStaff } from "./use-staff";

export function useUniqueRoles() {
  const { data: staffList, isLoading } = useStaff();

  const roles = staffList
    ? [...new Set(["agent", ...staffList.map(s => s.role).filter(Boolean)])].sort()
    : ["agent"];

  return { roles, isLoading };
}
