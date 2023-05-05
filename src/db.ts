import database from "mongoose";
import { msgModel } from "./model/msg_manager";
import { gameModel } from "./model/game_pool";
import { claimReward, getResult } from "./script";
import { PublicKey } from "@solana/web3.js";
import { Server } from "socket.io";
import {
  CLEAR_COOLDOWN,
  FIRST_COOLDOWN,
  getPendingCount,
  NEXT_COOLDOWN,
  REFUND_TIMEOUT,
  setProcessingStatus,
} from "../config";
import { winnerModel } from "./model/winner_pool";

require("dotenv").config("../.env");
const DB_CONNECTION = process.env.DB_CONNECTION;
let endTimer: NodeJS.Timeout;
let newTimer: NodeJS.Timeout;
let refundTimer: NodeJS.Timeout | undefined = undefined;
let endInterval: NodeJS.Timeout | undefined = undefined;
let newInterval: NodeJS.Timeout | undefined = undefined;

export const init = () => {
  if (DB_CONNECTION === undefined) return;
  if (database.connection.readyState === database.ConnectionStates.connected)
    return;
  database
    .connect(DB_CONNECTION)
    .then((v) => {
      console.log(`mongodb database connected`);
    })
    .catch((e) => {
      console.error(`mongodb error ${e}`);
    });
};

export const getLastPda = async () => {
  try {
    const item = await gameModel.find().sort({ _id: -1 });
    if (new Date().getTime() >= item[0].end_timestamp) {
      return {
        pda: "",
        endTime: -1,
      };
    } else {
      return {
        pda: item[0].game_pool,
        endTime: item[0].end_timestamp,
      };
    }
  } catch (error) {
    console.log("error in getLastPda");
    return {
      pda: "",
      endTime: -1,
    };
  }
};

export const getLastMessage = async () => {
  try {
    const item = await msgModel.find().sort({ _id: -1 }).limit(50);
    return item;
  } catch (error) {
    console.log("error in getLastMessage!");
  }
};
export const addMessage = async (user_name: string, msg: string) => {
  try {
    let ts = new Date();

    const newData = new msgModel({
      user_name: user_name,
      message: msg,
      timestamp: ts,
    });

    newData.save(function (err, book) {
      if (err) return console.error(err);
      console.log(newData, "Saved Successful");
    });
  } catch (error) {
    console.log("error in add message!");
  }
};

export const getLastWinners = async () => {
  try {
    const item = await winnerModel.find().sort({ _id: -1 }).limit(50);
    return item;
  } catch (error) {
    console.log("error in getLastWinners!");
  }
};

export const getTimes = async () => {
  try {
    const item = await winnerModel.count();
    return item;
  } catch (error) {
    console.log("error in getTimes!");
  }
};

export const getTotalSum = async () => {
  try {
    return winnerModel.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: "$payout" },
        },
      },
    ]);
  } catch (error) {
    console.log("error in getTotalSum!");
  }
};

export const addWinner = async (
  user_name: string,
  bet_amount: number,
  payout: number,
  tx: string
) => {
  try {
    const newData = new winnerModel({
      user: user_name,
      bet_amount: bet_amount,
      payout: payout,
      tx: tx,
    });

    newData.save(function (err, book) {
      if (err) return console.error(err);
      console.log(newData, "Saved Successful");
    });
  } catch (error) {
    console.log("error in add message!");
  }
};

export const createGame = async (
  startTimestamp: number,
  signer: string,
  amount: string,
  gamePool: string,
  io: Server
) => {
  try {
    const newData = new gameModel({
      start_timestamp: startTimestamp,
      game_pool: gamePool,
      entrants: 1,
      players: [{ address: signer, amount: parseFloat(amount) }],
    });

    // timeout for refund
    if (refundTimer) clearTimeout(refundTimer);
    refundTimer = setTimeout(async () => {
      console.log("---> refunding claim reward");
      await claimReward(new PublicKey(gamePool), io);

      clearTimeout(newTimer);
      newTimer = setTimeout(async () => {
        console.log("---> refunding new game ready");
        if (getPendingCount() === 0) {
          console.log("New GAME DATA:", new Date().toLocaleTimeString());
          io.emit("newGameReady", 0, []);
        }
      }, CLEAR_COOLDOWN);

      const filter = { game_pool: gamePool };
      const update = {
        end_timestamp: new Date().getTime(),
      };
      await gameModel.findOneAndUpdate(filter, update, {
        new: true,
      });
      console.log(" --> save refunding data on DB");
    }, REFUND_TIMEOUT);

    newData.save(function (err, book) {
      if (err) return console.error(err);
      console.log(newData, "Saved Successful");
    });
    const gameData = {
      start_ts: startTimestamp,
      game_pool: gamePool,
    };
    let lresult = await getResult(new PublicKey(gamePool));
    /// Input manually if can't read from PDA
    if (!lresult || !lresult.length)
      lresult = [
        {
          player: signer,
          amount: parseFloat(amount),
        },
      ];
    console.log(" --> startGameData:", lresult);

    io.emit("startGame", gamePool, 0, lresult, startTimestamp);
  } catch (error) {
    console.error(error);
    console.log("error in createGame!");
  }
};

export const enterGame = async (
  signer: string,
  amount: string,
  gamePool: string,
  io: Server
) => {
  try {
    const ts = new Date();
    const filter = { game_pool: gamePool };
    const fresult = await getResult(new PublicKey(gamePool));
    console.log(" --> enterGameData:", fresult);
    const item = await gameModel.find(filter);

    if (refundTimer) clearTimeout(refundTimer);

    let last_ts = 0;
    console.log("Get Last Timestamp ++++++");
    if (item[0].entrants == 1) {
      last_ts = ts.getTime() + FIRST_COOLDOWN;
    } else {
      last_ts = item[0].end_timestamp + NEXT_COOLDOWN;
    }

    if (fresult.length === 1 && signer === fresult[0].player) {
      last_ts = 0;
    }

    let players = item[0].players ?? [];
    let updated = false;
    for (let idx in players) {
      if (players[idx].address === signer) {
        players[idx].amount += parseFloat(amount);
        updated = true;
        break;
      }
    }

    if (!updated) {
      players.push({
        address: signer,
        amount: parseFloat(amount),
      });
    }

    const update = {
      end_timestamp: last_ts,
      entrants: 2,
      players,
    };

    if (!(fresult.length === 1 && signer === fresult[0].player)) {
      await gameModel.findOneAndUpdate(filter, update, {
        new: true,
      });
      console.log("Write data on DB");
    }

    if (last_ts != 0) {
      clearTimeout(endTimer);
      clearTimeout(newTimer);
      if (endInterval) {
        clearInterval(endInterval);
        endInterval = undefined;
      }
      if (newInterval) {
        clearInterval(newInterval);
        newInterval = undefined;
      }

      let timer = setTimeout(async () => {
        if (getPendingCount() === 0) {
          console.log("Claim Reward");
          setProcessingStatus(true);
          await claimReward(new PublicKey(gamePool), io);
          setProcessingStatus(false);
        } else {
          setProcessingStatus(true);
          endInterval = setInterval(async () => {
            console.log("---> pending claim reward");
            if (getPendingCount() === 0) {
              console.log("Claim Reward");
              clearInterval(endInterval);
              endInterval = undefined;
              console.log("--> claim Tx");
              await claimReward(new PublicKey(gamePool), io);
              setProcessingStatus(false);

              clearTimeout(newTimer);
              newTimer = setTimeout(async () => {
                console.log("---> pending sent new game ready");
                if (getPendingCount() === 0) {
                  console.log(
                    "New GAME DATA:",
                    new Date().toLocaleTimeString()
                  );
                  io.emit("newGameReady", 0, []);
                }
              }, CLEAR_COOLDOWN);
            }
          }, 1000);
        }
      }, last_ts - new Date().getTime());

      newTimer = setTimeout(async () => {
        if (getPendingCount() === 0) {
          console.log("New GAME DATA", new Date().toLocaleTimeString());
          io.emit("newGameReady", 0, []);
        }
      }, last_ts - new Date().getTime() + CLEAR_COOLDOWN);

      endTimer = timer;
    }
    // const lresult = await getResult(new PublicKey(gamePool));
    const lresult = update.players.map((player) => {
      return {
        player: player.address,
        amount: player.amount,
      };
    });
    console.log(" --> endTimeUpdated:", lresult);

    io.emit("endTimeUpdated", gamePool, last_ts, lresult);
  } catch (error) {
    console.error(error);
    console.log("error in enterGame!");
  }
};
