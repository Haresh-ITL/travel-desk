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
import { uuid } from "uuidv4";
import { travelDeskRouter } from "./routes/travel-desk-routes";
import { paymentRouter } from "./routes/paymentRoutes";
import { chatbotRouter } from "./routes/chatbot-routes";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

app.use("/api/auth", authRouter);
app.use("/api/employee", employeeRouter);
app.use("/api/manager", managerRouter);
app.use("/api/travel-desk", travelDeskRouter);
app.use("/api/payments", paymentRouter);
app.use("/api/chatbot", chatbotRouter);

const seed = async () => {
  const rolesCount = await Role.countDocuments();
  if (rolesCount === 0) {
    const empRoleUuid = uuid();
    const mgrRoleUuid = uuid();
    const deskRoleUuid = uuid();

    await Role.insertMany([
      { uuid: empRoleUuid, name: "EMPLOYEE" },
      { uuid: mgrRoleUuid, name: "MANAGER" },
      { uuid: deskRoleUuid, name: "TRAVEL_DESK_ADMIN" }
    ]);

    const hash = await bcrypt.hash("password", 10);
    await User.insertMany([
      {
        uuid: uuid(),
        name: "Employee One",
        email: "emp@test.com",
        password: hash,
        roleId: empRoleUuid,
        managerIds: []
      },
      {
        uuid: uuid(),
        name: "Manager One",
        email: "mgr@test.com",
        password: hash,
        roleId: mgrRoleUuid,
        managerIds: []
      },
      {
        uuid: uuid(),
        name: "Travel Desk Admin",
        email: "desk@test.com",
        password: hash,
        roleId: deskRoleUuid,
        managerIds: []
      }
    ]);
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
