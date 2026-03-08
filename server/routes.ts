import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage, setupSession } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

// Extend Express Session to include userId
declare module 'express-session' {
  interface SessionData {
    userId: number;
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupSession(app);

  app.post(api.auth.login.path, async (req, res) => {
    try {
      const input = api.auth.login.input.parse(req.body);
      const user = await storage.getUserByUsername(input.username);

      if (!user || user.password !== input.password) {
        return res.status(401).json({ message: "Username atau password salah" });
      }

      // IP Check
      const clientIp = req.ip || req.connection.remoteAddress || "";
      if (user.allowedIp && !clientIp.includes(user.allowedIp) && user.allowedIp !== "*") {
         return res.status(403).json({ message: "IP tidak sesuai" });
      }

      req.session.userId = user.id;
      res.json({ user });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.auth.me.path, async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    res.json(user);
  });

  app.post(api.auth.logout.path, (req, res) => {
    req.session.destroy(() => {
      res.json({ message: "Logged out" });
    });
  });

  app.get(api.staff.list.path, async (req, res) => {
    const staffList = await storage.getStaff();
    res.json(staffList);
  });

  app.post(api.staff.create.path, async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: "Forbidden: Only admins can add staff" });
    }

    try {
      const input = api.staff.create.input.parse(req.body);
      const newStaff = await storage.createStaff(input);
      
      // Automatically create user account with staff name as username
      const existingUser = await storage.getUserByUsername(input.name);
      if (!existingUser) {
        await storage.createUser({
          username: input.name,
          password: "password123", // Default password
          role: "agent",
          allowedIp: "*"
        });
      }
      
      res.status(201).json(newStaff);
    } catch (err) {
      if (err instanceof z.ZodError) {
         return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.leaves.list.path, async (req, res) => {
    const leavesList = await storage.getLeaves();
    res.json(leavesList);
  });

  app.post(api.leaves.create.path, async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const currentUser = await storage.getUser(req.session.userId);
    if (!currentUser) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const input = api.leaves.create.input.parse(req.body);
      
      // Agent hanya bisa membuat izin untuk diri sendiri
      if (currentUser.role === "agent") {
        const agentStaff = await storage.getStaff();
        const agentStaffName = currentUser.username;
        const agentStaffRecord = agentStaff.find(s => s.name === agentStaffName);
        
        if (!agentStaffRecord || agentStaffRecord.id !== input.staffId) {
          return res.status(403).json({ message: "Agent hanya bisa membuat izin untuk diri sendiri" });
        }
      }
      
      const today = new Date().toISOString().split('T')[0];
      const leaves = await storage.getLeaves();
      const staffLeavesToday = leaves.filter(l => l.staffId === input.staffId && l.date === today);

      if (staffLeavesToday.length >= 4) {
        return res.status(400).json({ message: "Maksimal izin 4x hari ini" });
      }

      const newLeave = await storage.createLeave({
        staffId: input.staffId,
        date: today
      });
      res.status(201).json(newLeave);
    } catch (err) {
      if (err instanceof z.ZodError) {
         return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch(api.leaves.clockIn.path, async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const leaveId = parseInt(req.params.id);
      const leaveRecord = await db.select().from(leaves).where(eq(leaves.id, leaveId)).then(r => r[0]);
      
      if (!leaveRecord) {
        return res.status(404).json({ message: "Leave record not found" });
      }

      const currentUser = await storage.getUser(req.session.userId);
      if (!currentUser) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Verify user can update this leave
      if (currentUser.role === "agent") {
        const agentStaffName = currentUser.username;
        const agentStaff = await storage.getStaff();
        const agentStaffRecord = agentStaff.find(s => s.name === agentStaffName);
        
        if (!agentStaffRecord || agentStaffRecord.id !== leaveRecord.staffId) {
          return res.status(403).json({ message: "Anda hanya bisa clock in izin milik Anda sendiri" });
        }
      }

      const updatedLeave = await storage.updateLeaveClockIn(leaveId, new Date());
      res.json(updatedLeave);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.users.list.path, async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: "Forbidden: Only admins can view users" });
    }
    const allUsers = await storage.getUsers();
    res.json(allUsers);
  });

  app.patch(api.users.updateIp.path, async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: "Forbidden: Only admins can update users" });
    }

    try {
      const input = api.users.updateIp.input.parse(req.body);
      const userId = parseInt(req.params.id);
      const targetUser = await storage.getUser(userId);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }
      const updatedUser = await storage.updateUserIp(userId, input.allowedIp);
      res.json(updatedUser);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch(api.users.updatePassword.path, async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: "Forbidden: Only admins can update passwords" });
    }

    try {
      const input = api.users.updatePassword.input.parse(req.body);
      const userId = parseInt(req.params.id);
      const targetUser = await storage.getUser(userId);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }
      const updatedUser = await storage.updateUserPassword(userId, input.password);
      res.json(updatedUser);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch(api.users.updateUsername.path, async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: "Forbidden: Only admins can update usernames" });
    }

    try {
      const input = api.users.updateUsername.input.parse(req.body);
      const userId = parseInt(req.params.id);
      const targetUser = await storage.getUser(userId);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }
      const updatedUser = await storage.updateUserUsername(userId, input.username);
      res.json(updatedUser);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch(api.staff.updateName.path, async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: "Forbidden: Only admins can update staff" });
    }

    try {
      const input = api.staff.updateName.input.parse(req.body);
      const staffId = parseInt(req.params.id);
      const staffRecord = await storage.getStaff().then(s => s.find(x => x.id === staffId));
      if (!staffRecord) {
        return res.status(404).json({ message: "Staff not found" });
      }
      const updatedStaff = await storage.updateStaffName(staffId, input.name);
      res.json(updatedStaff);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Whitelist IP management (stored in memory for simplicity, could be DB)
  let whitelistIps: string[] = [];

  app.get(api.whitelist.get.path, async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: "Forbidden: Only admins can view whitelist" });
    }
    res.json({ ips: whitelistIps });
  });

  app.patch(api.whitelist.update.path, async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: "Forbidden: Only admins can update whitelist" });
    }

    try {
      const input = api.whitelist.update.input.parse(req.body);
      whitelistIps = input.ips;
      res.json({ ips: whitelistIps });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Basic seeding if users table is empty
  try {
     const adminUser = await storage.getUserByUsername("admin");
     if (!adminUser) {
        await storage.createUser({
           username: "admin",
           password: "password123", // In a real app, hash this
           role: "admin",
           allowedIp: "*" // Allow all for demo
        });
     }
     const agentUser = await storage.getUserByUsername("agent");
     if (!agentUser) {
        await storage.createUser({
           username: "agent",
           password: "password123",
           role: "agent",
           allowedIp: "*" // Allow all for demo
        });
     }
  } catch (e) {
     console.error("Failed to seed initial users", e);
  }

  return httpServer;
}
