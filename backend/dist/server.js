"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const db_1 = require("./config/db");
const env_1 = require("./config/env");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const role_1 = require("./models/role");
const user_1 = require("./models/user");
const auth_routes_1 = require("./routes/auth-routes");
const employee_routes_1 = require("./routes/employee-routes");
const manager_routes_1 = require("./routes/manager-routes");
const admin_routes_1 = require("./routes/admin-routes");
const uuidv4_1 = require("uuidv4");
const travel_desk_routes_1 = require("./routes/travel-desk-routes");
const paymentRoutes_1 = require("./routes/paymentRoutes");
const chatbot_routes_1 = require("./routes/chatbot-routes");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '50mb' })); // Increase limit for base64 file uploads
app.use(express_1.default.urlencoded({ extended: true, limit: '50mb' }));
app.use("/uploads", express_1.default.static("uploads"));
app.use("/api/auth", auth_routes_1.authRouter);
app.use("/api/employee", employee_routes_1.employeeRouter);
app.use("/api/manager", manager_routes_1.managerRouter);
app.use("/api/admin", admin_routes_1.adminRouter);
app.use("/api/travel-desk", travel_desk_routes_1.travelDeskRouter);
app.use("/api/payments", paymentRoutes_1.paymentRouter);
app.use("/api/chatbot", chatbot_routes_1.chatbotRouter);
const seed = async () => {
    const rolesCount = await role_1.Role.countDocuments();
    if (rolesCount === 0) {
        const empRoleUuid = (0, uuidv4_1.uuid)();
        const mgrRoleUuid = (0, uuidv4_1.uuid)();
        const deskRoleUuid = (0, uuidv4_1.uuid)();
        const adminRoleUuid = (0, uuidv4_1.uuid)();
        await role_1.Role.insertMany([
            { uuid: empRoleUuid, name: "EMPLOYEE" },
            { uuid: mgrRoleUuid, name: "MANAGER" },
            { uuid: deskRoleUuid, name: "TRAVEL_DESK_ADMIN" },
            { uuid: adminRoleUuid, name: "ORG_ADMIN" }
        ]);
        const hash = await bcryptjs_1.default.hash("password", 10);
        // Generate UUIDs for users
        const employeeUuid = (0, uuidv4_1.uuid)();
        const managerUuid = (0, uuidv4_1.uuid)();
        const deskAdminUuid = (0, uuidv4_1.uuid)();
        const orgAdminUuid = (0, uuidv4_1.uuid)();
        // Create users
        await user_1.User.insertMany([
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
    await (0, db_1.connectDb)();
    await seed();
    app.listen(env_1.env.port, () => {
        console.log(`Server running on port ${env_1.env.port}`);
    });
};
start();
