import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StaffSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function StaffSearch({ value, onChange }: StaffSearchProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
      <Input
        placeholder="Cari nama staff..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10 pr-10 bg-background/50 border-white/10 focus-visible:ring-primary/30 rounded-xl h-11"
        data-testid="input-staff-search"
      />
      {value && (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onChange("")}
          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
          data-testid="button-clear-search"
        >
          <X className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}
