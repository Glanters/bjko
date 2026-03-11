import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Pencil } from "lucide-react";
import { useEditStaff } from "@/hooks/use-edit-staff";
import type { Staff } from "@shared/schema";

const JABATAN_OPTIONS = ["CS", "CS LINE", "KAPTEN", "KASIR"];

interface EditStaffDialogProps {
  staff: Staff;
}

export function EditStaffDialog({ staff }: EditStaffDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(staff.name);
  const [jabatan, setJabatan] = useState(staff.jabatan || staff.jobdesk);
  const { mutate: editStaff, isPending } = useEditStaff();

  const handleOpen = () => {
    setName(staff.name);
    setJabatan(staff.jabatan || staff.jobdesk);
    setOpen(true);
  };

  const handleSave = () => {
    if (!name.trim() || !jabatan) return;
    editStaff({ id: staff.id, name: name.trim(), jabatan }, {
      onSuccess: () => setOpen(false),
    });
  };

  const displayOptions = JABATAN_OPTIONS.includes(jabatan)
    ? JABATAN_OPTIONS
    : [...JABATAN_OPTIONS, jabatan].filter(Boolean);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleOpen}
          className="h-7 w-7 p-0 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10"
          data-testid={`button-edit-staff-${staff.id}`}
        >
          <Pencil className="w-3 h-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px] glass-panel border-white/10">
        <DialogHeader>
          <DialogTitle>Edit Data Staff</DialogTitle>
          <DialogDescription>Ubah nama atau jabatan staff ini</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Nama Staff</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Nama staff"
              data-testid="input-edit-staff-name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-jabatan">Jabatan</Label>
            <Select value={jabatan} onValueChange={setJabatan}>
              <SelectTrigger data-testid="select-edit-jabatan">
                <SelectValue placeholder="Pilih jabatan" />
              </SelectTrigger>
              <SelectContent>
                {displayOptions.map(j => (
                  <SelectItem key={j} value={j}>{j}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
          <Button onClick={handleSave} disabled={isPending || !name.trim() || !jabatan} data-testid="button-save-edit-staff">
            {isPending ? "Menyimpan..." : "Simpan"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
