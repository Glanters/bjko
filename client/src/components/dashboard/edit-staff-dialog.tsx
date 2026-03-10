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

const JOBDESK_OPTIONS = ["CS LINE", "CS", "KAPTEN", "KASIR"];

interface EditStaffDialogProps {
  staff: Staff;
}

export function EditStaffDialog({ staff }: EditStaffDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(staff.name);
  const [jobdesk, setJobdesk] = useState(staff.jobdesk);
  const { mutate: editStaff, isPending } = useEditStaff();

  const handleOpen = () => {
    setName(staff.name);
    setJobdesk(staff.jobdesk);
    setOpen(true);
  };

  const handleSave = () => {
    if (!name.trim() || !jobdesk) return;
    editStaff({ id: staff.id, name: name.trim(), jobdesk }, {
      onSuccess: () => setOpen(false),
    });
  };

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
            <Label htmlFor="edit-jobdesk">Jabatan</Label>
            <Select value={jobdesk} onValueChange={setJobdesk}>
              <SelectTrigger data-testid="select-edit-jobdesk">
                <SelectValue placeholder="Pilih jabatan" />
              </SelectTrigger>
              <SelectContent>
                {JOBDESK_OPTIONS.map(j => (
                  <SelectItem key={j} value={j}>{j}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
          <Button onClick={handleSave} disabled={isPending || !name.trim() || !jobdesk} data-testid="button-save-edit-staff">
            {isPending ? "Menyimpan..." : "Simpan"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
