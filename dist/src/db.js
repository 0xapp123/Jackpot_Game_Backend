"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.enterGame = exports.createGame = exports.addMessage = exports.getLastMessage = exports.getLastPda = exports.init = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const msg_manager_1 = require("./model/msg_manager");
const game_pool_1 = require("./model/game_pool");
const script_1 = require("./script");
const web3_js_1 = require("@solana/web3.js");
const config_1 = require("../config");
require('dotenv').config("../.env");
const DB_CONNECTION = process.env.DB_CONNECTION;
let endTimer;
let newTimer;
const init = () => {
    if (DB_CONNECTION === undefined)
        return;
    mongoose_1.default
        .connect(DB_CONNECTION)
        .then((v) => {
        console.log(`mongodb database connected`);
    })
        .catch((e) => {
        console.error(`mongodb error ${e}`);
    });
};
exports.init = init;
const getLastPda = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const item = yield game_pool_1.gameModel.find().sort({ _id: -1 });
        if (new Date().getTime() >= item[0].end_timestamp) {
            return {
                pda: "",
                endTime: -1
            };
        }
        else {
            return {
                pda: item[0].game_pool,
                endTime: item[0].end_timestamp
            };
        }
    }
    catch (error) {
        console.log('error in getLastPda');
        return {
            pda: "",
            endTime: -1
        };
    }
});
exports.getLastPda = getLastPda;
const getLastMessage = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const item = yield msg_manager_1.msgModel.find().sort({ _id: -1 }).limit(50);
        return item;
    }
    catch (error) {
        console.log('error in getLastMessage!');
    }
});
exports.getLastMessage = getLastMessage;
const addMessage = (user_name, msg) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let ts = new Date();
        const newData = new msg_manager_1.msgModel({
            user_name: user_name,
            message: msg,
            timestamp: ts
        });
        newData.save(function (err, book) {
            if (err)
                return console.error(err);
            console.log(newData, "Saved Successful");
        });
    }
    catch (error) {
        console.log('error in add message!');
    }
});
exports.addMessage = addMessage;
const createGame = (startTimestamp, gamePool, io) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const newData = new game_pool_1.gameModel({
            start_timestamp: startTimestamp,
            game_pool: gamePool,
            entrants: 1
        });
        newData.save(function (err, book) {
            if (err)
                return console.error(err);
            console.log(newData, "Saved Successful");
        });
        const gameData = {
            start_ts: startTimestamp,
            game_pool: gamePool
        };
        const lresult = yield (0, script_1.getResult)(new web3_js_1.PublicKey(gamePool));
        io.emit("startGame", gamePool, 0, lresult);
    }
    catch (error) {
        console.log('error in createGame!');
    }
});
exports.createGame = createGame;
const enterGame = (signer, gamePool, io) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const ts = new Date();
        const filter = { game_pool: gamePool };
        const fresult = yield (0, script_1.getResult)(new web3_js_1.PublicKey(gamePool));
        const item = yield game_pool_1.gameModel.find(filter);
        let last_ts = 0;
        console.log("Get Last Timestamp ++++++");
        if (item[0].entrants == 1) {
            last_ts = ts.getTime() + config_1.FIRST_COOLDOWN;
        }
        else {
            last_ts = item[0].end_timestamp + config_1.NEXT_COOLDOWN;
        }
        if (fresult.length === 1 && signer === fresult[0].player) {
            last_ts = 0;
        }
        const update = {
            end_timestamp: last_ts,
            entrants: 2
        };
        if (!(fresult.length === 1 && signer === fresult[0].player)) {
            yield game_pool_1.gameModel.findOneAndUpdate(filter, update, {
                new: true
            });
            console.log("Write data on DB");
        }
        if (last_ts != 0) {
            clearTimeout(endTimer);
            clearTimeout(newTimer);
            let timer = setTimeout(() => __awaiter(void 0, void 0, void 0, function* () {
                console.log("Claim Reward");
                yield (0, script_1.claimReward)(new web3_js_1.PublicKey(gamePool), io);
            }), last_ts - new Date().getTime());
            let timerNew = setTimeout(() => __awaiter(void 0, void 0, void 0, function* () {
                console.log("New GAME DATA");
                io.emit("newGameReady", 0, []);
            }), last_ts - new Date().getTime() + 6000);
            newTimer = timerNew;
            endTimer = timer;
        }
        const lresult = yield (0, script_1.getResult)(new web3_js_1.PublicKey(gamePool));
        io.emit("endTimeUpdated", gamePool, last_ts, lresult);
    }
    catch (error) {
        console.log('error in enterGame!');
    }
});
exports.enterGame = enterGame;
