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
exports.enterGame = exports.createGame = exports.addMessage = exports.getLastPda = exports.init = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const msg_manager_1 = require("./model/msg_manager");
const game_pool_1 = require("./model/game_pool");
const script_1 = require("./script");
const web3_js_1 = require("@solana/web3.js");
require('dotenv').config("../.env");
const DB_CONNECTION = process.env.DB_CONNECTION;
let endTimer;
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
        const item = yield game_pool_1.gameModel.find().sort({ _id: 1 });
        return item[0].game_pool;
    }
    catch (error) {
        console.error('error');
    }
});
exports.getLastPda = getLastPda;
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
        console.error('error!');
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
        io.emit("startGame", gameData);
    }
    catch (error) {
        console.error('error!');
    }
});
exports.createGame = createGame;
const enterGame = (gamePool, io) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const ts = new Date();
        const filter = { game_pool: gamePool };
        const item = yield game_pool_1.gameModel.find(filter);
        let last_ts = 0;
        if (item[0].entrants == 1) {
            last_ts = ts.getTime() + 600000;
        }
        else {
            last_ts = item[0].end_timestamp + 120000;
        }
        const update = {
            end_timestamp: last_ts,
            entrants: 2
        };
        yield game_pool_1.gameModel.findOneAndUpdate(filter, update, {
            new: true
        });
        if (last_ts != 0) {
            clearTimeout(endTimer);
            let timer = setTimeout(() => {
                (0, script_1.claimReward)(new web3_js_1.PublicKey(gamePool));
            }, last_ts - new Date().getTime());
            endTimer = timer;
            io.emit("endTimeUpdated", last_ts);
        }
    }
    catch (error) {
        console.error('error!');
    }
});
exports.enterGame = enterGame;
