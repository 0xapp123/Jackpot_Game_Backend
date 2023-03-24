import mongoose from "mongoose";

const gamePoolSchema = new mongoose.Schema(
  {
    start_timestamp: String,
    game_pool: String,
    end_timestamp: Number,
    entrants: Number,
    players: Array({
      address: String,
      amount: Number,
    }),
  },
  {
    timestamps: {
      createdAt: "created_at", // Use `created_at` to store the created date
      updatedAt: "updated_at", // and `updated_at` to store the last updated date
    },
  }
);

export const gameModel = mongoose.model("gamePool", gamePoolSchema);
