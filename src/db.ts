import database from "mongoose";
import { msgModel } from "./model/msg_manager";
import { gameModel } from "./model/game_pool";
import { claimReward, getResult } from "./script";
import { PublicKey } from "@solana/web3.js";
import { Server } from "socket.io";
import { FIRST_COOLDOWN, NEXT_COOLDOWN } from "../config";

require('dotenv').config("../.env");
const DB_CONNECTION = process.env.DB_CONNECTION;
let endTimer: NodeJS.Timeout;
let newTimer: NodeJS.Timeout;

export const init = () => {
  if (DB_CONNECTION === undefined) return;
  database
    .connect(DB_CONNECTION)
    .then((v) => {
      console.log(`mongodb database connected`);
    })
    .catch((e) => {
      console.error(`mongodb error ${e}`);
    });
}

export const getLastPda = async () => {
  try {
    const item = await gameModel.find().sort({ _id: -1 });
    if (new Date().getTime() >= item[0].end_timestamp){
      return {
        pda: "",
        endTime: -1 
      }
    } else {
      return {
        pda: item[0].game_pool,
        endTime: item[0].end_timestamp
      }
    }
  } catch (error) {
    console.log('error in getLastPda');
    return {
      pda: "",
      endTime: -1 
    }
  }

}

export const getLastMessage = async () => {
  try {
    const item = await msgModel.find().sort({ _id: -1 }).limit(50);
    return item;
  } catch (error) {
    console.log('error in getLastMessage!');
  }
}
export const addMessage = async (
  user_name: string,
  msg: string,
) => {
  try {
    let ts = new Date();

    const newData = new msgModel({
      user_name: user_name,
      message: msg,
      timestamp: ts
    });

    newData.save(function (err, book) {
      if (err) return console.error(err);
      console.log(newData, "Saved Successful");
    })
  } catch (error) {
    console.log('error in add message!')
  }

}

export const createGame = async (
  startTimestamp: number,
  gamePool: string,
  io: Server
) => {
  try {

    const newData = new gameModel({
      start_timestamp: startTimestamp,
      game_pool: gamePool,
      entrants: 1
    });

    newData.save(function (err, book) {
      if (err) return console.error(err);
      console.log(newData, "Saved Successful");
    })
    const gameData = {
      start_ts: startTimestamp,
      game_pool: gamePool
    }
    const lresult = await getResult(new PublicKey(gamePool));

    io.emit("startGame", gamePool, 0, lresult);
  } catch (error) {
    console.log('error in createGame!');
  }
}

export const enterGame = async (
  signer: string,
  gamePool: string,
  io: Server
) => {
  try {
    const ts = new Date();
    const filter = { game_pool: gamePool };
    const fresult = await getResult(new PublicKey(gamePool));
    const item = await gameModel.find(filter);
    let last_ts = 0;
    console.log("Get Last Timestamp ++++++");
    if (item[0].entrants == 1) {
      last_ts = ts.getTime() + FIRST_COOLDOWN;
    } else {
      last_ts = item[0].end_timestamp + NEXT_COOLDOWN;
    }

    if (fresult.length === 1 && signer === fresult[0].player) {
      last_ts = 0
    } 

    const update = {
      end_timestamp: last_ts,
      entrants: 2
    }

    if (!(fresult.length === 1 && signer === fresult[0].player)) {
      await gameModel.findOneAndUpdate(filter, update, {
        new: true
      });
      console.log("Write data on DB");
    }

    if (last_ts != 0) {
      clearTimeout(endTimer);
      clearTimeout(newTimer);

      let timer = setTimeout(async () => {
        console.log("Claim Reward")
        await claimReward(new PublicKey(gamePool), io)
      }, last_ts - new Date().getTime());

      let timerNew = setTimeout(async () => {
        console.log("New GAME DATA")
        io.emit("newGameReady", 0 , [])
      }, last_ts - new Date().getTime() + 6000);

      newTimer = timerNew;
      endTimer = timer;

    }
    const lresult = await getResult(new PublicKey(gamePool));

    io.emit("endTimeUpdated", gamePool, last_ts, lresult);


  } catch (error) {
    console.log('error in enterGame!')
  }
}