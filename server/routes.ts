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

      // IP Check — get real client IP from X-Forwarded-For (behind proxy)
      const forwarded = req.headers['x-forwarded-for'] as string | undefined;
      const clientIp = (forwarded ? forwarded.split(',')[0].trim() : null)
        || req.ip
        || (req.connection?.remoteAddress ?? "");

      // Per-user IP check
      if (user.allowedIp && !clientIp.includes(user.allowedIp) && user.allowedIp !== "*") {
         return res.status(403).json({ message: "IP tidak sesuai" });
      }

      // Global whitelist check — applies to all users except those with allowedIp="*"
      if (user.allowedIp !== "*") {
        const savedWl = await storage.getSetting('whitelist_ips');
        const globalWhitelist = savedWl ? savedWl.split('\n').filter(Boolean) : [];
        if (globalWhitelist.length > 0) {
          const isAllowed = globalWhitelist.some(ip => clientIp.includes(ip.trim()));
          if (!isAllowed) {
            return res.status(403).json({ message: "IP Anda tidak diizinkan. Hubungi admin." });
          }
        }
      }

      req.session.userId = user.id;
      await storage.createAuditLog({ action: "LOGIN", username: user.username, detail: `Login dari IP ${clientIp}` });
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
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    const perm = await getPermForUser(req.session.userId!);
    if (user.role !== 'admin' && !perm?.canAddStaff) {
      return res.status(403).json({ message: "Forbidden: Anda tidak memiliki izin menambahkan staff" });
    }

    try {
      const { name, jobdesk, shift } = req.body;
      if (!name || !jobdesk) return res.status(400).json({ message: "Nama dan jobdesk wajib diisi" });
      const VALID_SHIFTS = ["PAGI", "SORE", "MALAM"];
      const validatedShift = VALID_SHIFTS.includes(shift) ? shift : "PAGI";
      const input = { name: name.trim(), jobdesk: jobdesk.trim(), shift: validatedShift, role: "agent" };
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
      await logAudit(req.session.userId!, "ADD_STAFF", `Staff baru ditambahkan: ${input.name} (${input.jobdesk})`);
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

      const maxLeavesStr = await storage.getSetting("max_leaves_per_day");
      const maxLeavesPerDay = parseInt(maxLeavesStr || "4");
      if (staffLeavesToday.length >= maxLeavesPerDay) {
        return res.status(400).json({ message: `Maksimal izin ${maxLeavesPerDay}x hari ini` });
      }

      // Block if staff already has an active leave that hasn't been clocked in
      const activeLeave = staffLeavesToday.find(l => !l.clockInTime);
      if (activeLeave) {
        return res.status(400).json({ message: "Masih ada izin aktif yang belum clock in. Harap clock in terlebih dahulu." });
      }

      // Check jobdesk limit
      const staffData = await storage.getStaff();
      const staffRecord = staffData.find(s => s.id === input.staffId);
      if (staffRecord && jobdeskLimits[staffRecord.jobdesk]) {
        const maxConcurrent = jobdeskLimits[staffRecord.jobdesk];
        const concurrentLeaves = leaves.filter(l => {
          const staff = staffData.find(s => s.id === l.staffId);
          return staff?.jobdesk === staffRecord.jobdesk && l.date === today && !l.clockInTime;
        });
        if (concurrentLeaves.length >= maxConcurrent) {
          return res.status(400).json({ message: `Maksimal ${maxConcurrent} staff ${staffRecord.jobdesk} yang bisa keluar bersamaan` });
        }
      }

      const newLeave = await storage.createLeave({
        staffId: input.staffId,
        date: today
      });
      await logAudit(req.session.userId!, "START_LEAVE", `Staff ${staffRecord?.name || input.staffId} mulai izin`);
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
      const allLeaves = await storage.getLeaves();
      const leaveRecord = allLeaves.find(l => l.id === leaveId);
      
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
      const staffList2 = await storage.getStaff();
      const staffRec = staffList2.find(s => s.id === leaveRecord.staffId);
      await logAudit(req.session.userId!, "CLOCK_IN", `Staff ${staffRec?.name || leaveRecord.staffId} kembali dari izin`);
      res.json(updatedLeave);
    } catch (err) {
      console.error("Clock-in error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete(api.leaves.delete.path, async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: "Forbidden: Only admins can delete leaves" });
    }

    try {
      const leaveId = parseInt(req.params.id);
      const success = await storage.deleteLeave(leaveId);
      if (!success) {
        return res.status(404).json({ message: "Leave not found" });
      }
      res.json({ message: "Leave deleted successfully" });
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/leaves/reset/:staffId", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: "Forbidden: Only admins can reset leave limits" });
    }
    try {
      const staffId = parseInt(req.params.staffId);
      const today = new Date().toISOString().split('T')[0];
      const deleted = await storage.resetStaffLeavesToday(staffId, today);
      await storage.createAuditLog({
        action: "RESET_LEAVE_LIMIT",
        username: user.username,
        detail: `Reset limit izin staff ID ${staffId} (${deleted} record dihapus)`,
      });
      res.json({ message: "Limit izin berhasil direset", deleted });
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/leaves/delete-by-date", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: "Forbidden: Only admins can delete leaves" });
    }

    try {
      const { date } = req.body;
      if (!date) {
        return res.status(400).json({ message: "Date is required" });
      }
      const leaves = await storage.getLeaves();
      const leavesToDelete = leaves.filter(l => l.date === date);
      
      for (const leave of leavesToDelete) {
        await storage.deleteLeave(leave.id);
      }
      
      res.json({ message: `${leavesToDelete.length} leave(s) berhasil dihapus`, count: leavesToDelete.length });
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch(api.leaves.update.path, async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: "Forbidden: Only admins can update leaves" });
    }

    try {
      const leaveId = parseInt(req.params.id);
      const input = api.leaves.update.input.parse(req.body);
      const clockInTime = input.clockInTime ? new Date(input.clockInTime) : null;
      const updated = await storage.updateLeave(leaveId, clockInTime);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
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

  app.patch(api.users.bulkUpdateIp.path, async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: "Forbidden: Only admins can update users" });
    }
    try {
      const input = api.users.bulkUpdateIp.input.parse(req.body);
      const updated = await storage.bulkUpdateAgentIp(input.allowedIp);
      await logAudit(req.session.userId!, "BULK_UPDATE_IP", `IP semua agent diset ke: ${input.allowedIp} (${updated} user)`);
      res.json({ message: `Berhasil memperbarui IP untuk ${updated} pengguna`, updated });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch(api.users.bulkUpdatePassword.path, async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: "Forbidden: Only admins can bulk update passwords" });
    }
    try {
      const input = api.users.bulkUpdatePassword.input.parse(req.body);
      const updated = await storage.bulkUpdateAgentPassword(input.password);
      await logAudit(req.session.userId!, "BULK_UPDATE_PASSWORD", `Password semua agent diperbarui (${updated} user)`);
      res.json({ message: `Berhasil memperbarui password untuk ${updated} pengguna`, updated });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete(api.users.bulkDeleteAgents.path, async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: "Forbidden: Only admins can bulk delete agents" });
    }
    try {
      const deleted = await storage.bulkDeleteAgents();
      await logAudit(req.session.userId!, "BULK_DELETE_AGENTS", `Semua agent dihapus (${deleted} user)`);
      res.json({ message: `Berhasil menghapus ${deleted} pengguna agent`, deleted });
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch(api.users.updatePassword.path, async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(403).json({ message: "Forbidden" });
    }
    try {
      const input = api.users.updatePassword.input.parse(req.body);
      const userId = parseInt(req.params.id);
      const csLine = await isCsLine(req.session.userId);
      const perm = await getPermForUser(req.session.userId!);

      // Allow: admin (any), self with canEditPassword or no restriction, or CS LINE changing an agent password
      const isSelf = user.id === userId;
      if (user.role !== 'admin' && !isSelf && !csLine) {
        return res.status(403).json({ message: "Forbidden: Anda hanya dapat mengubah password milik sendiri" });
      }
      if (user.role !== 'admin' && isSelf && !csLine && !perm?.canEditPassword) {
        return res.status(403).json({ message: "Forbidden: Anda tidak memiliki izin mengubah password" });
      }
      const targetUser = await storage.getUser(userId);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }
      // CS LINE cannot change admin passwords
      if (csLine && user.role !== 'admin' && targetUser.role === 'admin') {
        return res.status(403).json({ message: "CS LINE tidak dapat mengubah password admin" });
      }
      const updatedUser = await storage.updateUserPassword(userId, input.password);
      const who = user.id === userId ? "sendiri" : `user ${targetUser.username}`;
      await logAudit(req.session.userId, "CHANGE_PASSWORD", `Password ${who} diubah`);
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
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    try {
      const input = api.users.updateUsername.input.parse(req.body);
      const userId = parseInt(req.params.id);
      const isSelf = user.id === userId;
      const perm = await getPermForUser(req.session.userId!);

      // Admins can change anyone; agents can only change their own if canEditName is granted
      if (user.role !== 'admin' && !isSelf) {
        return res.status(403).json({ message: "Forbidden: Anda hanya dapat mengubah nama sendiri" });
      }
      if (user.role !== 'admin' && isSelf && !perm?.canEditName) {
        return res.status(403).json({ message: "Forbidden: Anda tidak memiliki izin mengubah nama" });
      }
      const targetUser = await storage.getUser(userId);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }
      const updatedUser = await storage.updateUserUsername(userId, input.username);
      await logAudit(req.session.userId!, "CHANGE_USERNAME", `Username diubah: ${targetUser.username} → ${input.username}`);
      res.json(updatedUser);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch(api.users.updateAvatar.path, async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const targetUserId = parseInt(req.params.id);
    if (req.session.userId !== targetUserId && user.role !== 'admin') {
      return res.status(403).json({ message: "Forbidden" });
    }

    try {
      const input = api.users.updateAvatar.input.parse(req.body);
      const targetUser = await storage.getUser(targetUserId);
      if (!targetUser) return res.status(404).json({ message: "User not found" });
      const updatedUser = await storage.updateUserAvatar(targetUserId, input.avatarUrl);
      res.json(updatedUser);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete(api.users.delete.path, async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: "Forbidden: Only admins can delete users" });
    }

    try {
      const userId = parseInt(req.params.id);
      if (userId === 1 || user.id === userId) {
        return res.status(403).json({ message: "Tidak bisa menghapus akun admin atau akun sendiri" });
      }
      const targetUser = await storage.getUser(userId);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }
      await storage.deleteUser(userId);
      await logAudit(req.session.userId!, "DELETE_USER", `User dihapus: ${targetUser.username}`);
      res.json({ message: "User berhasil dihapus" });
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete(api.staff.bulkDeleteAll.path, async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: "Forbidden: Only admins can bulk delete staff" });
    }
    try {
      const deleted = await storage.bulkDeleteAllStaff();
      await logAudit(req.session.userId!, "BULK_DELETE_STAFF", `Semua data staff dihapus (${deleted} staff)`);
      res.json({ message: `Berhasil menghapus ${deleted} data staff`, deleted });
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete(api.staff.delete.path, async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    const perm = await getPermForUser(req.session.userId!);
    if (user.role !== 'admin' && !perm?.canDeleteStaff) {
      return res.status(403).json({ message: "Forbidden: Anda tidak memiliki izin menghapus staff" });
    }

    try {
      const staffId = parseInt(req.params.id);
      const targetStaff = await storage.getStaff();
      const staff = targetStaff.find(s => s.id === staffId);
      if (!staff) {
        return res.status(404).json({ message: "Staff not found" });
      }
      await storage.deleteStaff(staffId);
      await logAudit(req.session.userId!, "DELETE_STAFF", `Staff dihapus: ${staff.name} (${staff.jobdesk})`);
      res.json({ message: "Staff berhasil dihapus" });
    } catch (err) {
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

  // Whitelist IP management (persisted to DB)
  const savedWhitelist = await storage.getSetting('whitelist_ips');
  let whitelistIps: string[] = savedWhitelist ? savedWhitelist.split('\n').filter(Boolean) : [];

  // Jobdesk limits management (stored in memory, could be DB)
  let jobdeskLimits: Record<string, number> = {};

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
      await storage.setSetting('whitelist_ips', input.ips.join('\n'));
      res.json({ ips: whitelistIps });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.jobdeskLimits.get.path, async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: "Forbidden: Only admins can view jobdesk limits" });
    }
    res.json({ limits: jobdeskLimits });
  });

  app.patch(api.jobdeskLimits.update.path, async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: "Forbidden: Only admins can update jobdesk limits" });
    }

    try {
      const input = api.jobdeskLimits.update.input.parse(req.body);
      jobdeskLimits = input.limits;
      res.json({ limits: jobdeskLimits });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // --- Theme Settings ---
  app.get("/api/theme-settings", async (req, res) => {
    try {
      const bg = await storage.getSetting("theme_bg");
      const primary = await storage.getSetting("theme_primary");
      res.json({ bg: bg ?? null, primary: primary ?? null });
    } catch { res.status(500).json({ message: "Internal server error" }); }
  });

  app.post("/api/theme-settings", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ message: "Unauthorized" });
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== "admin") return res.status(403).json({ message: "Forbidden" });
    try {
      const { bg, primary } = req.body;
      if (bg !== undefined) await storage.setSetting("theme_bg", bg);
      if (primary !== undefined) await storage.setSetting("theme_primary", primary);
      await logAudit(req.session.userId, "UPDATE_THEME", "Tema warna dashboard diperbarui");
      res.json({ bg: bg ?? null, primary: primary ?? null });
    } catch { res.status(500).json({ message: "Internal server error" }); }
  });

  app.delete("/api/theme-settings", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ message: "Unauthorized" });
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== "admin") return res.status(403).json({ message: "Forbidden" });
    try {
      await storage.setSetting("theme_bg", "");
      await storage.setSetting("theme_primary", "");
      res.json({ message: "Tema direset ke default" });
    } catch { res.status(500).json({ message: "Internal server error" }); }
  });

  // --- Jobdesk Master List ---
  const JOBDESK_LIST_KEY = "jobdesk_master_list";

  const getJobdeskList = async (): Promise<string[]> => {
    const val = await storage.getSetting(JOBDESK_LIST_KEY);
    if (!val) return [];
    try { return JSON.parse(val); } catch { return []; }
  };

  const saveJobdeskList = async (list: string[]) => {
    await storage.setSetting(JOBDESK_LIST_KEY, JSON.stringify(Array.from(new Set(list))));
  };

  app.get("/api/jobdeskList", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ message: "Unauthorized" });
    const list = await getJobdeskList();
    res.json({ jobdesks: list });
  });

  app.post("/api/jobdeskList", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ message: "Unauthorized" });
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== "admin") return res.status(403).json({ message: "Forbidden" });
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: "Nama jobdesk wajib diisi" });
    const list = await getJobdeskList();
    if (!list.includes(name.trim())) {
      list.push(name.trim());
      await saveJobdeskList(list);
    }
    res.json({ jobdesks: list });
  });

  app.delete("/api/jobdeskList/:name", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ message: "Unauthorized" });
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== "admin") return res.status(403).json({ message: "Forbidden" });
    const name = decodeURIComponent(req.params.name);
    const list = await getJobdeskList();
    const updated = list.filter(j => j !== name);
    await saveJobdeskList(updated);
    await logAudit(req.session.userId, "DELETE_JOBDESK", `Jobdesk dihapus dari master: ${name}`);
    res.json({ jobdesks: updated });
  });

  // DELETE /api/jobdeskList - Clear all jabatan from master list
  app.delete("/api/jobdeskList", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ message: "Unauthorized" });
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== "admin") return res.status(403).json({ message: "Forbidden" });
    await saveJobdeskList([]);
    await logAudit(req.session.userId, "RESET_JOBDESK_LIST", "Seluruh daftar jabatan master dihapus/direset");
    res.json({ message: "Semua jabatan berhasil dihapus", jobdesks: [] });
  });

  // Helper to log audit actions
  const logAudit = async (userId: number, action: string, detail: string) => {
    try {
      const u = await storage.getUser(userId);
      if (u) await storage.createAuditLog({ action, username: u.username, detail });
    } catch {}
  };

  // Helper: get permission for a user by their staff jabatan (falls back to login role)
  const getPermForUser = async (userId: number) => {
    const u = await storage.getUser(userId);
    if (!u || u.role === 'admin') return null;
    const staffList = await storage.getStaff();
    const staff = staffList.find(s => s.name.toLowerCase() === u.username.toLowerCase());
    if (staff && staff.jobdesk) {
      const byJobdesk = await storage.getPermissionByRole(staff.jobdesk);
      if (byJobdesk) return byJobdesk;
    }
    return await storage.getPermissionByRole(u.role);
  };

  // Helper: check if a user is a CS LINE agent
  const isCsLine = async (userId: number): Promise<boolean> => {
    const u = await storage.getUser(userId);
    if (!u || u.role !== 'agent') return false;
    const staffList = await storage.getStaff();
    return staffList.some(s => s.name.toLowerCase() === u.username.toLowerCase() && s.jobdesk?.toUpperCase() === "CS LINE");
  };

  const isKapten = async (userId: number): Promise<boolean> => {
    const u = await storage.getUser(userId);
    if (!u) return false;
    const staffList = await storage.getStaff();
    return staffList.some(s => s.name.toLowerCase() === u.username.toLowerCase() && s.jobdesk?.toUpperCase() === "KAPTEN");
  };

  // PATCH /api/staff/:id - Update staff fields (name requires canEditName, jobdesk/shift requires canEditJobdesk)
  app.patch("/api/staff/:id", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ message: "Unauthorized" });
    const user = await storage.getUser(req.session.userId);
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    const perm = await getPermForUser(req.session.userId!);
    const isAdmin = user.role === 'admin';
    const canChangeJobdesk = isAdmin || !!perm?.canEditJobdesk;
    const canChangeName = isAdmin || !!perm?.canEditName;
    if (!canChangeJobdesk && !canChangeName) return res.status(403).json({ message: "Forbidden: Tidak ada izin edit staff" });
    try {
      const staffId = parseInt(req.params.id);
      const allStaff = await storage.getStaff();
      const existing = allStaff.find(s => s.id === staffId);
      if (!existing) return res.status(404).json({ message: "Staff tidak ditemukan" });
      const { name, jobdesk, shift } = req.body;
      const VALID_SHIFTS = ["PAGI", "SORE", "MALAM"];
      const finalName = canChangeName && name ? name.trim() : existing.name;
      const finalJobdesk = canChangeJobdesk && jobdesk ? jobdesk.trim() : existing.jobdesk;
      const finalShift = canChangeJobdesk && shift ? (VALID_SHIFTS.includes(shift) ? shift : existing.shift) : existing.shift;
      const updated = await storage.updateStaffFull(staffId, finalName, finalJobdesk, finalShift);
      await logAudit(req.session.userId, "UPDATE_STAFF", `Staff #${staffId} diupdate: ${finalName} / ${finalJobdesk} / ${finalShift}`);
      res.json(updated);
    } catch {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // PATCH /api/staff/:id/jobdesk - Update staff jobdesk only (admin or user with canEditJobdesk permission)
  app.patch("/api/staff/:id/jobdesk", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ message: "Unauthorized" });
    const user = await storage.getUser(req.session.userId);
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    const perm = await getPermForUser(req.session.userId!);
    if (user.role !== 'admin' && !perm?.canEditJobdesk) return res.status(403).json({ message: "Forbidden" });
    try {
      const staffId = parseInt(req.params.id);
      const { jobdesk } = req.body;
      if (!jobdesk) return res.status(400).json({ message: "Jobdesk wajib diisi" });
      const updated = await storage.updateStaffJobdesk(staffId, jobdesk.trim());
      await logAudit(req.session.userId, "UPDATE_STAFF_JOBDESK", `Jobdesk staff #${staffId} diubah ke: ${jobdesk}`);
      res.json(updated);
    } catch {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // PATCH /api/staff/:id/cuti-status - Update staff cuti status (admin, CS LINE, kapten)
  app.patch("/api/staff/:id/cuti-status", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ message: "Unauthorized" });
    const user = await storage.getUser(req.session.userId);
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    const csLine = await isCsLine(req.session.userId);
    const kapten = await isKapten(req.session.userId);
    if (user.role !== 'admin' && !csLine && !kapten) return res.status(403).json({ message: "Forbidden" });
    try {
      const staffId = parseInt(req.params.id);
      const { status } = req.body;
      const updated = await storage.updateStaffCutiStatus(staffId, status ?? null);
      await logAudit(req.session.userId, "UPDATE_CUTI_STATUS", `Status cuti staff #${staffId} diubah ke: ${status ?? "kosong"}`);
      res.json(updated);
    } catch {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // GET /api/audit-logs — admin or CS LINE
  app.get("/api/audit-logs", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ message: "Unauthorized" });
    const user = await storage.getUser(req.session.userId);
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    const csLine = await isCsLine(req.session.userId);
    if (user.role !== 'admin' && !csLine) return res.status(403).json({ message: "Forbidden" });
    const logs = await storage.getAuditLogs();
    res.json(logs);
  });

  // GET /api/users/agents — admin or CS LINE
  app.get("/api/users/agents", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ message: "Unauthorized" });
    const user = await storage.getUser(req.session.userId);
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    const csLine = await isCsLine(req.session.userId);
    if (user.role !== 'admin' && !csLine) return res.status(403).json({ message: "Forbidden" });
    const allUsers = await storage.getUsers();
    const agents = allUsers.filter(u => u.role === 'agent');
    res.json(agents.map(u => ({ id: u.id, username: u.username, role: u.role })));
  });

  // GET /api/settings — all authenticated users can READ settings (only admin can WRITE via POST)
  app.get("/api/settings", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ message: "Unauthorized" });
    const user = await storage.getUser(req.session.userId);
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    const allSettings = await storage.getAllSettings();
    const obj: Record<string, string> = {};
    for (const s of allSettings) obj[s.key] = s.value;
    res.json(obj);
  });

  // POST /api/settings
  app.post("/api/settings", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ message: "Unauthorized" });
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== 'admin') return res.status(403).json({ message: "Forbidden" });
    try {
      const { key, value } = req.body;
      if (!key || value === undefined) return res.status(400).json({ message: "Key dan value wajib diisi" });
      const setting = await storage.setSetting(key, String(value));
      await logAudit(req.session.userId, "UPDATE_SETTING", `Setting ${key} = ${value}`);
      res.json(setting);
    } catch {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // GET /api/analytics
  app.get("/api/analytics", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ message: "Unauthorized" });
    try {
      const allLeaves = await storage.getLeaves();
      const allStaff = await storage.getStaff();
      const today = new Date().toISOString().split('T')[0];

      // Today's leaves
      const todayLeaves = allLeaves.filter(l => l.date === today);

      // Last 7 days trend
      const last7Days: { date: string; count: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        last7Days.push({ date: dateStr, count: allLeaves.filter(l => l.date === dateStr).length });
      }

      // Leaves per jobdesk today
      const leavesByJobdesk: Record<string, number> = {};
      for (const l of todayLeaves) {
        const s = allStaff.find(x => x.id === l.staffId);
        if (s) leavesByJobdesk[s.jobdesk] = (leavesByJobdesk[s.jobdesk] || 0) + 1;
      }

      // Top 5 staff by leave count (all time)
      const staffLeaveCounts: Record<number, number> = {};
      for (const l of allLeaves) staffLeaveCounts[l.staffId] = (staffLeaveCounts[l.staffId] || 0) + 1;
      const top5 = Object.entries(staffLeaveCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([staffId, count]) => {
          const s = allStaff.find(x => x.id === Number(staffId));
          return { staffId: Number(staffId), name: s?.name || 'Unknown', jobdesk: s?.jobdesk || '-', count };
        });

      // On-time vs late
      const completed = allLeaves.filter(l => l.clockInTime);
      let onTime = 0, late = 0;
      for (const l of completed) {
        const start = new Date(l.startTime).getTime();
        const ci = new Date(l.clockInTime!).getTime();
        const diffMin = (ci - start) / 60000;
        if (diffMin <= 15) onTime++; else late++;
      }

      res.json({
        todayCount: todayLeaves.length,
        totalCount: allLeaves.length,
        last7Days,
        leavesByJobdesk,
        top5Staff: top5,
        onTimeCount: onTime,
        lateCount: late,
        pendingCount: allLeaves.filter(l => !l.clockInTime).length,
      });
    } catch {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // GET /api/backup - Export all data
  app.get("/api/backup", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ message: "Unauthorized" });
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== 'admin') return res.status(403).json({ message: "Forbidden" });
    try {
      const [allStaff, allLeaves, allUsers, allSettings] = await Promise.all([
        storage.getStaff(),
        storage.getLeaves(),
        storage.getUsers(),
        storage.getAllSettings(),
      ]);
      const backup = {
        exportedAt: new Date().toISOString(),
        version: "1.0",
        staff: allStaff,
        leaves: allLeaves,
        users: allUsers.map(u => ({ ...u, password: '***hidden***' })),
        settings: allSettings,
      };
      await logAudit(req.session.userId, "BACKUP", "Data backup diunduh");
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=backup-${today()}.json`);
      res.json(backup);
    } catch {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  function today() { return new Date().toISOString().split('T')[0]; }

  // POST /api/restore - Restore staff and leaves from backup
  app.post("/api/restore", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ message: "Unauthorized" });
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== 'admin') return res.status(403).json({ message: "Forbidden" });
    try {
      const { staff: staffData, settings: settingsData } = req.body;
      if (settingsData && Array.isArray(settingsData)) {
        for (const s of settingsData) {
          if (s.key && s.value) await storage.setSetting(s.key, s.value);
        }
      }
      await logAudit(req.session.userId, "RESTORE", "Pengaturan dipulihkan dari backup");
      res.json({ message: "Restore berhasil" });
    } catch {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ── Permissions (Staff Edit Access) ──────────────────────────────────────
  app.get('/api/permissions', async (req, res) => {
    try {
      if (!req.session.userId) return res.status(401).json({ message: "Unauthorized" });
      const reqUser = await storage.getUser(req.session.userId);
      if (!reqUser || reqUser.role !== 'admin') return res.status(403).json({ message: "Forbidden" });
      const perms = await storage.getPermissions();
      res.json(perms);
    } catch { res.status(500).json({ message: "Internal server error" }); }
  });

  app.get('/api/permissions/me', async (req, res) => {
    try {
      if (!req.session.userId) return res.status(401).json({ message: "Unauthorized" });
      const user = await storage.getUser(req.session.userId);
      if (!user) return res.status(401).json({ message: "Unauthorized" });
      const perm = await getPermForUser(req.session.userId!);
      res.json(perm ?? null);
    } catch { res.status(500).json({ message: "Internal server error" }); }
  });

  app.post('/api/permissions/:role', async (req, res) => {
    try {
      if (!req.session.userId) return res.status(401).json({ message: "Unauthorized" });
      const reqUser = await storage.getUser(req.session.userId);
      if (!reqUser || reqUser.role !== 'admin') return res.status(403).json({ message: "Forbidden" });
      const role = req.params.role;
      if (!role) return res.status(400).json({ message: "Role tidak valid" });
      const { canAddStaff, allowedShifts, allowedJobdesks, canEditJobdesk, canDeleteStaff, canEditName, canEditPassword } = req.body;
      const perm = await storage.upsertPermission({ role, canAddStaff: !!canAddStaff, allowedShifts: allowedShifts ?? '', allowedJobdesks: allowedJobdesks ?? '', canEditJobdesk: !!canEditJobdesk, canDeleteStaff: !!canDeleteStaff, canEditName: !!canEditName, canEditPassword: !!canEditPassword });
      await logAudit(req.session.userId, "PERMISSION_UPDATE", `Izin edit diperbarui untuk role: ${role}`);
      res.json(perm);
    } catch { res.status(500).json({ message: "Internal server error" }); }
  });

  app.delete('/api/permissions/:role', async (req, res) => {
    try {
      if (!req.session.userId) return res.status(401).json({ message: "Unauthorized" });
      const reqUser = await storage.getUser(req.session.userId);
      if (!reqUser || reqUser.role !== 'admin') return res.status(403).json({ message: "Forbidden" });
      const role = req.params.role;
      if (!role) return res.status(400).json({ message: "Role tidak valid" });
      await storage.deletePermission(role);
      await logAudit(req.session.userId, "PERMISSION_DELETE", `Izin edit dihapus untuk role: ${role}`);
      res.json({ message: "Izin dihapus" });
    } catch { res.status(500).json({ message: "Internal server error" }); }
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
