import mongoose from "mongoose";

const msgSchema = new mongoose.Schema(
    {
        user_name: String,
        message: String,
        timestamp: Number,
    },
    {
        timestamps: {
            createdAt: "created_at", // Use `created_at` to store the created date
            updatedAt: "updated_at", // and `updated_at` to store the last updated date
        },
    }
);

export const msgModel = mongoose.model("message", msgSchema);
