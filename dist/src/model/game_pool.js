"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.gameModel = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const gamePoolSchema = new mongoose_1.default.Schema({
    start_timestamp: String,
    game_pool: String,
    end_timestamp: Number,
    entrants: Number
}, {
    timestamps: {
        createdAt: "created_at",
        updatedAt: "updated_at", // and `updated_at` to store the last updated date
    },
});
exports.gameModel = mongoose_1.default.model("gamePool", gamePoolSchema);
