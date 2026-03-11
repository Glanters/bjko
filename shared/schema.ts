import { pgTable, serial, text, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("agent"),
  allowedIp: text("allowed_ip"),
  avatarUrl: text("avatar_url"),
});

export const staff = pgTable("staff", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  jabatan: text("jabatan").notNull().default(""),
  jobdesk: text("jobdesk").notNull(),
  role: text("role").notNull(),
  shift: text("shift").notNull().default("PAGI"),
  cutiStatus: text("cuti_status"),
});

export const leaves = pgTable("leaves", {
  id: serial("id").primaryKey(),
  staffId: integer("staff_id").notNull(),
  startTime: timestamp("start_time").notNull().defaultNow(),
  clockInTime: timestamp("clock_in_time"),
  date: text("date").notNull(),
});

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  action: text("action").notNull(),
  username: text("username").notNull(),
  detail: text("detail"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const staffPermissions = pgTable("staff_permissions", {
  id: serial("id").primaryKey(),
  role: text("role").notNull().unique(),
  canAddStaff: boolean("can_add_staff").notNull().default(false),
  allowedShifts: text("allowed_shifts").notNull().default(""),
  allowedJobdesks: text("allowed_jobdesks").notNull().default(""),
  canEditJobdesk: boolean("can_edit_jobdesk").notNull().default(false),
  canDeleteStaff: boolean("can_delete_staff").notNull().default(false),
  canEditName: boolean("can_edit_name").notNull().default(false),
  canEditPassword: boolean("can_edit_password").notNull().default(false),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertStaffSchema = createInsertSchema(staff).omit({ id: true });
export const insertLeaveSchema = createInsertSchema(leaves).omit({ id: true, startTime: true, date: true });
export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({ id: true, createdAt: true });
export const insertStaffPermissionSchema = createInsertSchema(staffPermissions).omit({ id: true });

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Staff = typeof staff.$inferSelect;
export type InsertStaff = z.infer<typeof insertStaffSchema>;
export type Leave = typeof leaves.$inferSelect;
export type InsertLeave = z.infer<typeof insertLeaveSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type Setting = typeof settings.$inferSelect;
export type StaffPermission = typeof staffPermissions.$inferSelect;
export type InsertStaffPermission = z.infer<typeof insertStaffPermissionSchema>;
