"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = require("mongoose");
const userDocumentSchema = new mongoose_1.Schema({
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
const userSchema = new mongoose_1.Schema({
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
exports.User = (0, mongoose_1.model)("User", userSchema);
