import { Router } from "express";
import bcrypt from "bcryptjs";
import { env } from "../config/env";
import { Role } from "../models/role";
import { User } from "../models/user";
import { uuid } from "uuidv4";
import { logger } from "../logger";

export const authRouter = Router();

// registration (basic)
authRouter.post("/register", async (req, res) => {
  const { name, email, password, roleName } = req.body;
  const role = await Role.findOne({ name: roleName });
  if (!role) return res.status(400).json({ message: "Invalid role" });

  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ message: "Email exists" });

  const hash = await bcrypt.hash(password, env.bcryptRounds);
  const user = await User.create({
    uuid: uuid(),
    name,
    email,
    password: hash,
    roleId: role.uuid,
    managerIds: []
  });
  res.json({ uuid: user.uuid, roleId: user.roleId });
});

// simple login returning uuid for header use
authRouter.post("/login", async (req, res) => {
  
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(400).json({ message: "Invalid credentials" });

  const role = await Role.findOne({ uuid: user.roleId });

  res.json({ 
    userUuid: user.uuid, 
    roleId: user.roleId, 
    roleName: role?.name,
    name: user.name || '',
    email: user.email || ''
  });
});
