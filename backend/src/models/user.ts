import { Schema, model } from "mongoose";

export interface IUser {
  uuid: string;
  name: string;
  email: string;
  password: string;
  roleId: string;        
  managerIds: string[];  
}

const userSchema = new Schema<IUser>({
  uuid: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  roleId: { type: String, required: true },
  managerIds: [{ type: String }]
});

export const User = model<IUser>("User", userSchema);
