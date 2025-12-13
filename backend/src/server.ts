import express from "express";
import cors from "cors";
import { connectDb } from "./config/db";
import { env } from "./config/env";
import bcrypt from "bcryptjs";
import { Role } from "./models/role";
import { User } from "./models/user";
import { authRouter } from "./routes/auth-routes";
import { employeeRouter } from "./routes/employee-routes";
import { managerRouter } from "./routes/manager-routes";
import { adminRouter } from "./routes/admin-routes";
import { uuid } from "uuidv4";
import { travelDeskRouter } from "./routes/travel-desk-routes";
import { paymentRouter } from "./routes/paymentRoutes";
import { chatbotRouter } from "./routes/chatbot-routes";

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increase limit for base64 file uploads
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use("/uploads", express.static("uploads"));

app.use("/api/auth", authRouter);
app.use("/api/employee", employeeRouter);
app.use("/api/manager", managerRouter);
app.use("/api/admin", adminRouter);
app.use("/api/travel-desk", travelDeskRouter);
app.use("/api/payments", paymentRouter);
app.use("/api/chatbot", chatbotRouter);

const seed = async () => {
  const rolesCount = await Role.countDocuments();
  if (rolesCount === 0) {
    const empRoleUuid = uuid();
    const mgrRoleUuid = uuid();
    const deskRoleUuid = uuid();
    const adminRoleUuid = uuid();

    await Role.insertMany([
      { uuid: empRoleUuid, name: "EMPLOYEE" },
      { uuid: mgrRoleUuid, name: "MANAGER" },
      { uuid: deskRoleUuid, name: "TRAVEL_DESK_ADMIN" },
      { uuid: adminRoleUuid, name: "ORG_ADMIN" }
    ]);

    const hash = await bcrypt.hash("password", 10);
    
    // Generate UUIDs for users
    const employeeUuid = uuid();
    const managerUuid = uuid();
    const deskAdminUuid = uuid();
    const orgAdminUuid = uuid();
    
    // Create users
    await User.insertMany([
      {
        uuid: employeeUuid,
        name: "Magesh Employee",
        email: "emp@test.com",
        password: hash,
        roleId: empRoleUuid,
        managerIds: [managerUuid] // Map employee to manager
      },
      {
        uuid: managerUuid,
        name: "Magesh Manager",
        email: "mgr@test.com",
        password: hash,
        roleId: mgrRoleUuid,
        managerIds: []
      },
      {
        uuid: deskAdminUuid,
        name: "Travel Desk Admin Magesh",
        email: "desk@test.com",
        password: hash,
        roleId: deskRoleUuid,
        managerIds: []
      },
      {
        uuid: orgAdminUuid,
        name: "Org Admin",
        email: "admin@test.com",
        password: hash,
        roleId: adminRoleUuid,
        managerIds: []
      }
    ]);
    
    console.log('Seed data created:');
    console.log(`- Employee (${employeeUuid}) mapped to Manager (${managerUuid})`);
    console.log(`- Manager: ${managerUuid}`);
    console.log(`- Travel Desk Admin: ${deskAdminUuid}`);
    console.log(`- Org Admin: ${orgAdminUuid}`);
  }
};

const start = async () => {
  await connectDb();
  await seed();
  app.listen(env.port, () => {
    console.log(`Server running on port ${env.port}`);
  });
};

start();
