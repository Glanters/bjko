import { connectDB } from "../server/db";
import { storage } from "../server/storage";
import mongoose from "mongoose";

async function createAdmin() {
  try {
    await connectDB();
    console.log("Connected to DB");

    const existingAdmin = await storage.getUserByUsername("admin");
    if (existingAdmin) {
      console.log("Admin user already exists:", existingAdmin);
    } else {
      const newAdmin = await storage.createUser({
        username: "admin",
        password: "password", // Di lingkungan produksi, pastikan password di-hash jika sistem auth mengharapkannya
        role: "admin",
      });
      console.log("Admin user created successfully:", newAdmin);
    }
  } catch (error) {
    console.error("Failed to create admin:", error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

createAdmin();
