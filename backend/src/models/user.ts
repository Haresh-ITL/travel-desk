import { Schema, model } from "mongoose";

export interface UserDocument {
  type: string;
  url?: string; // File URL (for backward compatibility)
  data?: string; // Base64 encoded file data
  mimeType?: string; // MIME type of the file (e.g., 'image/jpeg', 'application/pdf')
  fileName?: string;
  uploadedAt: Date;
}

export interface IUser {
  uuid: string;
  name: string;
  email: string;
  password: string;
  roleId: string;        
  managerIds: string[];
  documents?: UserDocument[];
  createdAt?: Date;
  updatedAt?: Date;
}

const userDocumentSchema = new Schema<UserDocument>({
  type: { type: String, required: true },
  url: { type: String }, // Optional - for backward compatibility
  data: { type: String }, // Base64 encoded file data (can be large)
  mimeType: { type: String }, // MIME type
  fileName: { type: String },
  uploadedAt: { type: Date, default: Date.now }
}, { 
  _id: false,
  strict: true 
});

const userSchema = new Schema<IUser>({
  uuid: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  roleId: { type: String, required: true },
  managerIds: [{ type: String }],
  documents: {
    type: [userDocumentSchema],
    default: []
  }
}, {
  timestamps: true,
  strict: true
});

export const User = model<IUser>("User", userSchema);
