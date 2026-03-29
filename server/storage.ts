import { type User, type InsertUser, type Staff, type InsertStaff, type Leave, type InsertLeave, type AuditLog, type InsertAuditLog, type Setting, type StaffPermission, type InsertStaffPermission } from "@shared/schema";
import session from "express-session";
import MongoStore from "connect-mongo";
import { UserModel, StaffModel, LeaveModel, AuditLogModel, SettingModel, StaffPermissionModel } from "./models";

export function setupSession(app: any) {
  app.use(
    session({
      store: MongoStore.create({ 
        mongoUrl: process.env.MONGODB_URI as string,
        collectionName: 'sessions'
      }),
      secret: process.env.SESSION_SECRET || "dashboard-secret",
      resave: false,
      saveUninitialized: false,
      cookie: { maxAge: 24 * 60 * 60 * 1000 },
    })
  );
}

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(): Promise<User[]>;
  updateUserIp(id: number, allowedIp: string): Promise<User>;
  bulkUpdateAgentIp(allowedIp: string): Promise<number>;
  bulkUpdateAgentPassword(password: string): Promise<number>;
  bulkDeleteAgents(): Promise<number>;
  updateUserPassword(id: number, password: string): Promise<User>;
  updateUserUsername(id: number, username: string): Promise<User>;
  deleteUser(id: number): Promise<boolean>;
  getStaff(): Promise<Staff[]>;
  createStaff(s: InsertStaff): Promise<Staff>;
  updateStaffName(id: number, name: string): Promise<Staff>;
  updateStaff(id: number, name: string, jobdesk: string): Promise<Staff>;
  updateStaffJabatan(id: number, name: string, jabatan: string): Promise<Staff>;
  updateStaffFull(id: number, name: string, jobdesk: string, shift: string): Promise<Staff>;
  updateStaffJobdesk(id: number, jobdesk: string): Promise<Staff>;
  updateStaffCutiStatus(id: number, status: string | null): Promise<Staff>;
  updateStaffCustomHours(id: number, customStart: string | null, customEnd: string | null): Promise<Staff>;
  deleteStaff(id: number): Promise<boolean>;
  bulkDeleteAllStaff(): Promise<number>;
  getLeaves(): Promise<Leave[]>;
  createLeave(leave: InsertLeave & { date: string }): Promise<Leave>;
  updateLeaveClockIn(id: number, clockInTime: Date): Promise<Leave>;
  deleteLeave(id: number): Promise<boolean>;
  updateLeave(id: number, clockInTime: Date | null): Promise<Leave>;
  updateLeavePunishment(id: number, punishment: string | null): Promise<Leave>;
  resetStaffLeavesToday(staffId: number, date: string): Promise<number>;
  getAuditLogs(): Promise<AuditLog[]>;
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getSetting(key: string): Promise<string | undefined>;
  setSetting(key: string, value: string): Promise<Setting>;
  getAllSettings(): Promise<Setting[]>;
  getPermissions(): Promise<StaffPermission[]>;
  getPermissionByRole(role: string): Promise<StaffPermission | undefined>;
  upsertPermission(perm: InsertStaffPermission): Promise<StaffPermission>;
  deletePermission(role: string): Promise<boolean>;
  updateUserAvatar(id: number, avatarUrl: string): Promise<User>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const user = await UserModel.findOne({ id }).lean();
    return user ? (user as unknown as User) : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const user = await UserModel.findOne({ username }).lean();
    return user ? (user as unknown as User) : undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user = new UserModel(insertUser);
    await user.save();
    return user.toObject() as unknown as User;
  }

  async getUsers(): Promise<User[]> {
    return await UserModel.find().lean() as unknown as User[];
  }

  async updateUserIp(id: number, allowedIp: string): Promise<User> {
    const user = await UserModel.findOneAndUpdate({ id }, { allowedIp }, { new: true }).lean();
    return user as unknown as User;
  }

  async bulkUpdateAgentIp(allowedIp: string): Promise<number> {
    const result = await UserModel.updateMany({ role: 'agent' }, { allowedIp });
    return result.modifiedCount;
  }

  async bulkUpdateAgentPassword(password: string): Promise<number> {
    const result = await UserModel.updateMany({ role: 'agent' }, { password });
    return result.modifiedCount;
  }

  async updateUserPassword(id: number, password: string): Promise<User> {
    const user = await UserModel.findOneAndUpdate({ id }, { password }, { new: true }).lean();
    return user as unknown as User;
  }

  async updateUserUsername(id: number, username: string): Promise<User> {
    const user = await UserModel.findOneAndUpdate({ id }, { username }, { new: true }).lean();
    return user as unknown as User;
  }

  async updateUserAvatar(id: number, avatarUrl: string): Promise<User> {
    const user = await UserModel.findOneAndUpdate({ id }, { avatarUrl }, { new: true }).lean();
    return user as unknown as User;
  }

  async getStaff(): Promise<Staff[]> {
    return await StaffModel.find().lean() as unknown as Staff[];
  }

  async createStaff(insertStaff: InsertStaff): Promise<Staff> {
    const staff = new StaffModel(insertStaff);
    await staff.save();
    return staff.toObject() as unknown as Staff;
  }

  async updateStaffName(id: number, name: string): Promise<Staff> {
    const staff = await StaffModel.findOneAndUpdate({ id }, { name }, { new: true }).lean();
    return staff as unknown as Staff;
  }

  async updateStaff(id: number, name: string, jobdesk: string): Promise<Staff> {
    const staff = await StaffModel.findOneAndUpdate({ id }, { name, jobdesk }, { new: true }).lean();
    return staff as unknown as Staff;
  }

  async updateStaffJabatan(id: number, name: string, jabatan: string): Promise<Staff> {
    const staff = await StaffModel.findOneAndUpdate({ id }, { name, jabatan, jobdesk: jabatan }, { new: true }).lean();
    return staff as unknown as Staff;
  }

  async updateStaffFull(id: number, name: string, jobdesk: string, shift: string): Promise<Staff> {
    const staff = await StaffModel.findOneAndUpdate({ id }, { name, jabatan: jobdesk, jobdesk, shift }, { new: true }).lean();
    return staff as unknown as Staff;
  }

  async updateStaffJobdesk(id: number, jobdesk: string): Promise<Staff> {
    const staff = await StaffModel.findOneAndUpdate({ id }, { jabatan: jobdesk, jobdesk }, { new: true }).lean();
    return staff as unknown as Staff;
  }

  async updateStaffCutiStatus(id: number, status: string | null): Promise<Staff> {
    const staff = await StaffModel.findOneAndUpdate({ id }, { cutiStatus: status }, { new: true }).lean();
    return staff as unknown as Staff;
  }

  async updateStaffCustomHours(id: number, customStart: string | null, customEnd: string | null): Promise<Staff> {
    const staff = await StaffModel.findOneAndUpdate({ id }, { customStart, customEnd }, { new: true }).lean();
    return staff as unknown as Staff;
  }

  async getLeaves(): Promise<Leave[]> {
    return await LeaveModel.find().lean() as unknown as Leave[];
  }

  async createLeave(insertLeave: InsertLeave & { date: string }): Promise<Leave> {
    const leave = new LeaveModel(insertLeave);
    await leave.save();
    return leave.toObject() as unknown as Leave;
  }

  async updateLeaveClockIn(id: number, clockInTime: Date): Promise<Leave> {
    const leave = await LeaveModel.findOneAndUpdate({ id }, { clockInTime }, { new: true }).lean();
    return leave as unknown as Leave;
  }

  async deleteLeave(id: number): Promise<boolean> {
    const result = await LeaveModel.deleteOne({ id });
    return result.deletedCount === 1;
  }

  async updateLeave(id: number, clockInTime: Date | null): Promise<Leave> {
    const leave = await LeaveModel.findOneAndUpdate({ id }, { clockInTime }, { new: true }).lean();
    return leave as unknown as Leave;
  }

  async updateLeavePunishment(id: number, punishment: string | null): Promise<Leave> {
    const leave = await LeaveModel.findOneAndUpdate({ id }, { punishment }, { new: true }).lean();
    return leave as unknown as Leave;
  }

  async resetStaffLeavesToday(staffId: number, date: string): Promise<number> {
    const result = await LeaveModel.deleteMany({ staffId, date });
    return result.deletedCount || 0;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await UserModel.deleteOne({ id });
    return result.deletedCount === 1;
  }

  async bulkDeleteAgents(): Promise<number> {
    const result = await UserModel.deleteMany({ role: 'agent' });
    return result.deletedCount || 0;
  }

  async deleteStaff(id: number): Promise<boolean> {
    const result = await StaffModel.deleteOne({ id });
    return result.deletedCount === 1;
  }

  async bulkDeleteAllStaff(): Promise<number> {
    const result = await StaffModel.deleteMany({});
    return result.deletedCount || 0;
  }

  async getAuditLogs(): Promise<AuditLog[]> {
    return await AuditLogModel.find().sort({ createdAt: -1 }).lean() as unknown as AuditLog[];
  }

  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const entry = new AuditLogModel(log);
    await entry.save();
    return entry.toObject() as unknown as AuditLog;
  }

  async getSetting(key: string): Promise<string | undefined> {
    const row = await SettingModel.findOne({ key }).lean();
    return row?.value;
  }

  async setSetting(key: string, value: string): Promise<Setting> {
    const row = await SettingModel.findOneAndUpdate(
      { key },
      { key, value },
      { new: true, upsert: true }
    ).lean();
    return row as unknown as Setting;
  }

  async getAllSettings(): Promise<Setting[]> {
    return await SettingModel.find().lean() as unknown as Setting[];
  }

  async getPermissions(): Promise<StaffPermission[]> {
    return await StaffPermissionModel.find().lean() as unknown as StaffPermission[];
  }

  async getPermissionByRole(role: string): Promise<StaffPermission | undefined> {
    const perm = await StaffPermissionModel.findOne({ role: new RegExp('^' + role + '$', 'i') }).lean();
    return perm ? (perm as unknown as StaffPermission) : undefined;
  }

  async upsertPermission(perm: InsertStaffPermission): Promise<StaffPermission> {
    const row = await StaffPermissionModel.findOneAndUpdate(
      { role: perm.role },
      perm,
      { new: true, upsert: true }
    ).lean();
    return row as unknown as StaffPermission;
  }

  async deletePermission(role: string): Promise<boolean> {
    const result = await StaffPermissionModel.deleteOne({ role: new RegExp('^' + role + '$', 'i') });
    return result.deletedCount === 1;
  }
}

export const storage = new DatabaseStorage();
