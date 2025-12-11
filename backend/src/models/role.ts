import { Schema, model } from "mongoose";

export interface IRole {
  uuid: string;
  name: "EMPLOYEE" | "MANAGER" | "TRAVEL_DESK_ADMIN";
}

const roleSchema = new Schema<IRole>({
  uuid: { type: String, required: true, unique: true },
  name: { type: String, required: true }
});

export const Role = model<IRole>("Role", roleSchema);
