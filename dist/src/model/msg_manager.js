"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.msgModel = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const msgSchema = new mongoose_1.default.Schema({
    user_name: String,
    message: String,
    timestamp: Number,
}, {
    timestamps: {
        createdAt: "created_at",
        updatedAt: "updated_at", // and `updated_at` to store the last updated date
    },
});
exports.msgModel = mongoose_1.default.model("message", msgSchema);
