import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("agent"), // 'admin' | 'agent'
  allowedIp: text("allowed_ip"), // Optional IP restriction
});

export const staff = pgTable("staff", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  jobdesk: text("jobdesk").notNull(),
  role: text("role").notNull(),
});

export const leaves = pgTable("leaves", {
  id: serial("id").primaryKey(),
  staffId: integer("staff_id").notNull(),
  startTime: timestamp("start_time").notNull().defaultNow(),
  clockInTime: timestamp("clock_in_time"), // Waktu masuk/clock in
  date: text("date").notNull(), // Format 'YYYY-MM-DD' for easy querying
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertStaffSchema = createInsertSchema(staff).omit({ id: true });
export const insertLeaveSchema = createInsertSchema(leaves).omit({ id: true, startTime: true, date: true });

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Staff = typeof staff.$inferSelect;
export type InsertStaff = z.infer<typeof insertStaffSchema>;
export type Leave = typeof leaves.$inferSelect;
export type InsertLeave = z.infer<typeof insertLeaveSchema>;
