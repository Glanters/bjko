import { users, staff, leaves, type User, type InsertUser, type Staff, type InsertStaff, type Leave, type InsertLeave } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresStore = connectPg(session);

export function setupSession(app: any) {
  app.use(
    session({
      store: new PostgresStore({ pool, createTableIfMissing: true }),
      secret: process.env.SESSION_SECRET || "dashboard-secret",
      resave: false,
      saveUninitialized: false,
      cookie: { maxAge: 24 * 60 * 60 * 1000 }, // 24 hours
    })
  );
}

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(): Promise<User[]>;
  updateUserIp(id: number, allowedIp: string): Promise<User>;
  updateUserPassword(id: number, password: string): Promise<User>;
  updateUserUsername(id: number, username: string): Promise<User>;
  deleteUser(id: number): Promise<boolean>;
  getStaff(): Promise<Staff[]>;
  createStaff(staff: InsertStaff): Promise<Staff>;
  updateStaffName(id: number, name: string): Promise<Staff>;
  getLeaves(): Promise<Leave[]>;
  createLeave(leave: InsertLeave): Promise<Leave>;
  updateLeaveClockIn(id: number, clockInTime: Date): Promise<Leave>;
  deleteLeave(id: number): Promise<boolean>;
  updateLeave(id: number, clockInTime: Date | null): Promise<Leave>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async updateUserIp(id: number, allowedIp: string): Promise<User> {
    const [user] = await db.update(users).set({ allowedIp }).where(eq(users.id, id)).returning();
    return user;
  }

  async updateUserPassword(id: number, password: string): Promise<User> {
    const [user] = await db.update(users).set({ password }).where(eq(users.id, id)).returning();
    return user;
  }

  async updateUserUsername(id: number, username: string): Promise<User> {
    const [user] = await db.update(users).set({ username }).where(eq(users.id, id)).returning();
    return user;
  }

  async getStaff(): Promise<Staff[]> {
    return await db.select().from(staff);
  }

  async createStaff(insertStaff: InsertStaff): Promise<Staff> {
    const [newStaff] = await db.insert(staff).values(insertStaff).returning();
    return newStaff;
  }

  async updateStaffName(id: number, name: string): Promise<Staff> {
    const [staffRecord] = await db.update(staff).set({ name }).where(eq(staff.id, id)).returning();
    return staffRecord;
  }

  async getLeaves(): Promise<Leave[]> {
    return await db.select().from(leaves);
  }

  async createLeave(insertLeave: InsertLeave): Promise<Leave> {
    const [leave] = await db.insert(leaves).values(insertLeave).returning();
    return leave;
  }

  async updateLeaveClockIn(id: number, clockInTime: Date): Promise<Leave> {
    const [leave] = await db.update(leaves).set({ clockInTime }).where(eq(leaves.id, id)).returning();
    return leave;
  }

  async deleteLeave(id: number): Promise<boolean> {
    const result = await db.delete(leaves).where(eq(leaves.id, id));
    return !!result;
  }

  async updateLeave(id: number, clockInTime: Date | null): Promise<Leave> {
    const [leave] = await db.update(leaves).set({ clockInTime }).where(eq(leaves.id, id)).returning();
    return leave;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return !!result;
  }
}

export const storage = new DatabaseStorage();
