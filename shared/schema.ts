import { z } from "zod";

export const insertUserSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
  role: z.string().optional().default("agent"),
  allowedIp: z.string().nullable().optional(),
  avatarUrl: z.string().nullable().optional(),
});

export const insertStaffSchema = z.object({
  name: z.string().min(1),
  jabatan: z.string().optional().default(""),
  jobdesk: z.string().min(1),
  role: z.string().min(1),
  shift: z.string().optional().default("PAGI"),
  cutiStatus: z.string().nullable().optional(),
  customStart: z.string().nullable().optional(),
  customEnd: z.string().nullable().optional(),
});

export const insertLeaveSchema = z.object({
  staffId: z.number().or(z.string()),
  clockInTime: z.date().nullable().optional(),
  punishment: z.string().nullable().optional(),
});

export const insertAuditLogSchema = z.object({
  action: z.string().min(1),
  username: z.string().min(1),
  detail: z.string().nullable().optional(),
});

export const insertStaffPermissionSchema = z.object({
  role: z.string().min(1),
  canAddStaff: z.boolean().optional().default(false),
  allowedShifts: z.string().optional().default(""),
  allowedJobdesks: z.string().optional().default(""),
  canEditJobdesk: z.boolean().optional().default(false),
  canDeleteStaff: z.boolean().optional().default(false),
  canEditName: z.boolean().optional().default(false),
  canEditPassword: z.boolean().optional().default(false),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = InsertUser & { id: number };

export type InsertStaff = z.infer<typeof insertStaffSchema>;
export type Staff = InsertStaff & { id: number };

export type InsertLeave = z.infer<typeof insertLeaveSchema>;
export type Leave = InsertLeave & { id: number; startTime: Date; date: string };

export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = InsertAuditLog & { id: number; createdAt: Date };

export type Setting = { key: string; value: string };

export type InsertStaffPermission = z.infer<typeof insertStaffPermissionSchema>;
export type StaffPermission = InsertStaffPermission & { id: number };
