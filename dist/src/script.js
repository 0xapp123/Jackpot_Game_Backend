"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.sleep = exports.getStateByKey = exports.getResult = exports.createClaimRewardTx = exports.claimReward = exports.getDataFromSignature = exports.performTx = exports.addMessageIx = exports.getLastMsgIx = exports.getLastPdaIx = exports.NONCE_LIST = exports.PROGRAM_ID = exports.VAULT_SEED = exports.solConnection = exports.SOLANA_DEVNET = exports.SOLANA_MAINNET = void 0;
const anchor = __importStar(require("@project-serum/anchor"));
const anchor_1 = require("@project-serum/anchor");
const db_1 = require("./db");
const web3_js_1 = require("@solana/web3.js");
const bytes_1 = require("@project-serum/anchor/dist/cjs/utils/bytes");
const db_2 = require("./db");
const jackpot_1 = require("./jackpot");
const backend_wallet_json_1 = __importDefault(require("./backend-wallet.json"));
exports.SOLANA_MAINNET = "https://api.mainnet-beta.solana.com";
exports.SOLANA_DEVNET = "https://api.devnet.solana.com";
exports.solConnection = new web3_js_1.Connection(exports.SOLANA_DEVNET, "confirmed");
exports.VAULT_SEED = "vault-authority";
exports.PROGRAM_ID = process.env.PROGRAM_ID;
const programId = new anchor.web3.PublicKey(exports.PROGRAM_ID);
const wallet = new anchor_1.Wallet(web3_js_1.Keypair.fromSecretKey(Uint8Array.from(backend_wallet_json_1.default), { skipValidation: true }));
const newProvider = new anchor.AnchorProvider(exports.solConnection, wallet, {});
var program = new anchor.Program(jackpot_1.IDL, programId, newProvider);
exports.NONCE_LIST = [
    'WPNHsFPy',
    '4QUPibxi',
    'LUcdzUyn',
    '2uH66Ws3'
];
const getLastPdaIx = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        (0, db_1.init)();
        const result = yield (0, db_1.getLastPda)();
        return result;
    }
    catch (e) {
        console.log(e, " : error from add Msg");
        return false;
    }
});
exports.getLastPdaIx = getLastPdaIx;
const getLastMsgIx = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        (0, db_1.init)();
        const result = yield (0, db_1.getLastMessage)();
        return result;
    }
    catch (e) {
        console.log(e, " : error from add Msg");
        return false;
    }
});
exports.getLastMsgIx = getLastMsgIx;
const addMessageIx = (user_name, msg) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        (0, db_1.init)();
        const result = yield (0, db_1.addMessage)(user_name, msg);
        return result;
    }
    catch (e) {
        console.log(e, " : error from add Msg");
        return false;
    }
});
exports.addMessageIx = addMessageIx;
const performTx = (txId, io) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        for (let i = 0;; i++) {
            (0, exports.sleep)(1000);
            let txInfo = yield (0, exports.getDataFromSignature)(txId);
            if (txInfo !== undefined) {
                (0, db_1.init)();
                const tp = txInfo.type;
                switch (tp) {
                    case 'PlayGame':
                        yield (0, db_2.createGame)(txInfo.time, txInfo.gamePool, io);
                        break;
                    case 'EnterGame':
                        yield (0, db_1.enterGame)(txInfo.signer, txInfo.gamePool, io);
                        break;
                    case 'ClaimReward':
                        break;
                }
                break;
            }
        }
        return true;
    }
    catch (e) {
        console.log(e, " : error from perform");
        return false;
    }
});
exports.performTx = performTx;
const getDataFromSignature = (sig) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let tx = yield exports.solConnection.getParsedTransaction(sig, 'finalized');
        if (tx && !tx.meta.err) {
            let length = tx.transaction.message.instructions.length;
            let hash = "";
            let valid = -1;
            let ixId = -1;
            for (let i = 0; i < length; i++) {
                for (let j = 0; j < exports.NONCE_LIST.length; j++) {
                    hash = tx.transaction.message.instructions[i].data;
                    if (hash != undefined && hash.slice(0, 8) == exports.NONCE_LIST[j]) {
                        valid = j;
                        break;
                    }
                }
                if (valid > -1) {
                    ixId = i;
                    break;
                }
            }
            let result;
            let accountKeys = tx.transaction.message.instructions[ixId].accounts;
            let signer = accountKeys[0].toBase58();
            let gamePda = accountKeys[1].toBase58();
            console.log("gamePda", gamePda);
            switch (valid) {
                case 0: {
                    console.log("Initialize");
                    result = { type: "Initialize" };
                    break;
                }
                case 1: {
                    console.log("PlayGame");
                    let bytes = bytes_1.bs58.decode(hash);
                    let b = bytes.slice(8, 16).reverse();
                    let damount = new anchor.BN(b).toNumber().toString();
                    result = {
                        signer: signer,
                        gamePool: gamePda,
                        amount: damount,
                        time: tx.blockTime,
                        type: "PlayGame",
                    };
                    break;
                }
                case 2: {
                    console.log("EnterGame");
                    let bytes = bytes_1.bs58.decode(hash);
                    let b = bytes.slice(8, 16).reverse();
                    let damount = new anchor.BN(b).toNumber().toString();
                    result = {
                        signer: signer,
                        gamePool: gamePda,
                        amount: damount,
                        time: tx.blockTime,
                        type: "EnterGame",
                    };
                    break;
                }
                case 3: {
                    console.log("ClaimReward");
                    const instruction = tx.meta.innerInstructions[0].instructions[0];
                    const damount = instruction.parsed.info.lamports;
                    result = {
                        signer: signer,
                        gamePool: gamePda,
                        winner: accountKeys[2].toBase58(),
                        amount: damount,
                        type: "ClaimReward",
                    };
                    break;
                }
            }
            return result;
        }
    }
    catch (e) {
        console.log("SSSSSSSSSSSSSS");
        console.log("error: ", e);
    }
});
exports.getDataFromSignature = getDataFromSignature;
const claimReward = (pda, io) => __awaiter(void 0, void 0, void 0, function* () {
    const tx = yield (0, exports.createClaimRewardTx)(wallet.publicKey, pda, io);
    const txId = yield newProvider.sendAndConfirm(tx, [], { commitment: "confirmed" });
    console.log("Signature:", txId);
});
exports.claimReward = claimReward;
const createClaimRewardTx = (userAddress, gamePool, io) => __awaiter(void 0, void 0, void 0, function* () {
    const [solVault, bump] = yield web3_js_1.PublicKey.findProgramAddress([Buffer.from(exports.VAULT_SEED)], programId);
    const state = yield (0, exports.getStateByKey)(gamePool);
    const totalDeposit = state.totalDeposit.toNumber();
    const randPosition = state.rand.toNumber() % totalDeposit;
    let total = randPosition;
    let valid = 0;
    let index = 0;
    for (let i = 0; i < state.depositAmounts.length; i++) {
        if (total > state.depositAmounts[i].toNumber()) {
            total -= state.depositAmounts[i].toNumber();
        }
        else {
            index = i;
            valid = 1;
            break;
        }
    }
    if (valid != 1)
        return;
    io.emit("gameEnded", {
        winner: state.entrants[index].toBase58(),
        resultHeight: randPosition / totalDeposit
    });
    const tx = new web3_js_1.Transaction();
    tx.add(program.instruction.claimReward(bump, {
        accounts: {
            admin: userAddress,
            gamePool,
            winner: state.entrants[index],
            solVault,
            systemProgram: web3_js_1.SystemProgram.programId,
        },
        instructions: [],
        signers: [],
    }));
    return tx;
});
exports.createClaimRewardTx = createClaimRewardTx;
const getResult = (gameKey) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const firstResult = yield (0, exports.getStateByKey)(gameKey);
        const gameInfo = [];
        for (let i = 0; i < firstResult.entrants.length; i++) {
            gameInfo.push({
                player: firstResult.entrants[i].toBase58(),
                amount: firstResult.depositAmounts[i].toNumber()
            });
        }
        return gameInfo;
    }
    catch (_a) {
        return null;
    }
});
exports.getResult = getResult;
const getStateByKey = (gameKey) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const gameState = yield program.account.gamePool.fetch(gameKey);
        return gameState;
    }
    catch (_b) {
        return null;
    }
});
exports.getStateByKey = getStateByKey;
const sleep = (time) => {
    return new Promise(resolve => setTimeout(resolve, time));
};
exports.sleep = sleep;
