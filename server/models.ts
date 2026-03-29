import mongoose from "mongoose";

const CounterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 }
});

export const Counter = mongoose.models.Counter || mongoose.model("Counter", CounterSchema);

const getNextSequence = async (name: string) => {
  const counter = await Counter.findByIdAndUpdate(
    name,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return counter.seq;
};

const UserSchema = new mongoose.Schema({
  id: { type: Number, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: "agent" },
  allowedIp: { type: String, default: null },
  avatarUrl: { type: String, default: null }
});

UserSchema.pre("save", async function() {
  if (this.isNew && !this.id) {
    this.id = await getNextSequence("userId");
  }
});

export const UserModel = mongoose.models.User || mongoose.model("User", UserSchema);

const StaffSchema = new mongoose.Schema({
  id: { type: Number, unique: true },
  name: { type: String, required: true },
  jabatan: { type: String, default: "" },
  jobdesk: { type: String, required: true },
  role: { type: String, required: true },
  shift: { type: String, default: "PAGI" },
  cutiStatus: { type: String, default: null },
  customStart: { type: String, default: null },
  customEnd: { type: String, default: null }
});

StaffSchema.pre("save", async function() {
  if (this.isNew && !this.id) {
    this.id = await getNextSequence("staffId");
  }
});

export const StaffModel = mongoose.models.Staff || mongoose.model("Staff", StaffSchema);

const LeaveSchema = new mongoose.Schema({
  id: { type: Number, unique: true },
  staffId: { type: Number, required: true },
  startTime: { type: Date, default: Date.now },
  clockInTime: { type: Date, default: null },
  date: { type: String, required: true },
  punishment: { type: String, default: null }
});

LeaveSchema.pre("save", async function() {
  if (this.isNew && !this.id) {
    this.id = await getNextSequence("leaveId");
  }
});

export const LeaveModel = mongoose.models.Leave || mongoose.model("Leave", LeaveSchema);

const AuditLogSchema = new mongoose.Schema({
  id: { type: Number, unique: true },
  action: { type: String, required: true },
  username: { type: String, required: true },
  detail: { type: String, default: null },
  createdAt: { type: Date, default: Date.now }
});

AuditLogSchema.pre("save", async function() {
  if (this.isNew && !this.id) {
    this.id = await getNextSequence("auditLogId");
  }
});

export const AuditLogModel = mongoose.models.AuditLog || mongoose.model("AuditLog", AuditLogSchema);

const SettingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: String, required: true }
});

export const SettingModel = mongoose.models.Setting || mongoose.model("Setting", SettingSchema);

const StaffPermissionSchema = new mongoose.Schema({
  id: { type: Number, unique: true },
  role: { type: String, required: true, unique: true },
  canAddStaff: { type: Boolean, default: false },
  allowedShifts: { type: String, default: "" },
  allowedJobdesks: { type: String, default: "" },
  canEditJobdesk: { type: Boolean, default: false },
  canDeleteStaff: { type: Boolean, default: false },
  canEditName: { type: Boolean, default: false },
  canEditPassword: { type: Boolean, default: false }
});

StaffPermissionSchema.pre("save", async function() {
  if (this.isNew && !this.id) {
    this.id = await getNextSequence("staffPermissionId");
  }
});

export const StaffPermissionModel = mongoose.models.StaffPermission || mongoose.model("StaffPermission", StaffPermissionSchema);
