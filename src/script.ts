
import * as anchor from '@project-serum/anchor';
import { Program, Wallet, web3 } from '@project-serum/anchor';
import { addMessage, enterGame, getLastMessage, getLastPda, init } from './db';
import {
    Connection,
    PartiallyDecodedInstruction,
    ParsedInstruction,
    Keypair,
    PublicKey,
    SystemProgram,
    Transaction
} from '@solana/web3.js';
import { bs58 } from '@project-serum/anchor/dist/cjs/utils/bytes';
import { createGame } from './db';
import { IDL as Jackpot } from './jackpot';
import WalletSeed from './backend-wallet.json'
import { Server } from 'socket.io';

export const SOLANA_MAINNET = "https://a2-mind-prd-api.azurewebsites.net/rpc";
export const SOLANA_DEVNET = "https://api.devnet.solana.com";
export const solConnection = new Connection(SOLANA_MAINNET, "confirmed");
export const VAULT_SEED = "vault-authority";
export const PROGRAM_ID = process.env.PROGRAM_ID;


const programId = new anchor.web3.PublicKey(PROGRAM_ID);

const wallet = new Wallet(
    Keypair.fromSecretKey(Uint8Array.from(WalletSeed), { skipValidation: true })
);
const newProvider = new anchor.AnchorProvider(solConnection, wallet, {});
var program = new anchor.Program(Jackpot, programId, newProvider) as Program;

export const NONCE_LIST = [
    'WPNHsFPy',
    '4QUPibxi',
    'LUcdzUyn',
    '2uH66Ws3'
];


export const getLastPdaIx = async (
) => {
    try {
        init();
        const result = await getLastPda();
        return result;
    } catch (e) {
        console.log(e, " : error from add Msg")
        return false;
    }
}

export const getLastMsgIx = async (
) => {
    try {
        init();
        const result = await getLastMessage();
        return result;
    } catch (e) {
        console.log(e, " : error from add Msg")
        return false;
    }
}
export const addMessageIx = async (
    user_name: string,
    msg: string
) => {
    try {
        init();
        const result = await addMessage(user_name, msg);
        return result;
    } catch (e) {
        console.log(e, " : error from add Msg")
        return false;
    }
}


export const performTx = async (
    txId: string,
    io: Server
) => {
    try {
        for (let i = 0; ; i++) {
            sleep(1000)
            let txInfo = await getDataFromSignature(txId);
            if (txInfo !== undefined) {
                init();
                const tp = txInfo.type;

                switch (tp) {
                    case 'PlayGame':
                        await createGame(txInfo.time, txInfo.gamePool, io);
                        break;
                    case 'EnterGame':
                        await enterGame(txInfo.signer, txInfo.gamePool, io);
                        break;
                    case 'ClaimReward':
                        break;
                }

                break;
            }
        }
        return true;

    } catch (e) {
        console.log(e, " : error from perform")
        return false;
    }
}


export const getDataFromSignature = async (sig: string) => {
    try {
        let tx = await solConnection.getParsedTransaction(sig, 'finalized');
        if (tx && !tx.meta.err) {
    
            let length = tx.transaction.message.instructions.length;
            let hash = "";
            let valid = -1;
            let ixId = -1;
    
    
            for (let i = 0; i < length; i++) {
                for (let j = 0; j < NONCE_LIST.length; j++) {
                    hash = (
                        tx.transaction.message.instructions[i] as PartiallyDecodedInstruction
                    ).data;
                    if (hash != undefined && hash.slice(0, 8) == NONCE_LIST[j]) {
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
    
            let accountKeys = (
                tx.transaction.message.instructions[ixId] as PartiallyDecodedInstruction
            ).accounts;
            let signer = accountKeys[0].toBase58();
            let gamePda = accountKeys[1].toBase58()
            console.log("gamePda", gamePda)
            switch (valid) {
                case 0: {
                    console.log("Initialize");
                    result = { type: "Initialize" };
                    break;
                }
                case 1: {
                    console.log("PlayGame");
                    let bytes = bs58.decode(hash);
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
                    let bytes = bs58.decode(hash);
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
                    const instruction = tx.meta.innerInstructions[0].instructions[0] as ParsedInstruction;
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
    } catch(e) {
        console.log("SSSSSSSSSSSSSS")
        console.log("error: ", e);
         
    }

}

export const claimReward = async (pda: PublicKey, io: Server) => {
    const tx = await createClaimRewardTx(wallet.publicKey, pda, io);
    const txId = await newProvider.sendAndConfirm(tx, [], { commitment: "confirmed" });
    console.log("Signature:", txId);
}

export const createClaimRewardTx = async (
    userAddress: PublicKey,
    gamePool: PublicKey,
    io: Server
) => {

    const [solVault, bump] = await PublicKey.findProgramAddress(
        [Buffer.from(VAULT_SEED)],
        programId
    );
    const state = await getStateByKey(gamePool);
    const totalDeposit = state.totalDeposit.toNumber();
    const randPosition = state.rand.toNumber() % totalDeposit;
    let total = randPosition;

    let valid = 0;
    let index = 0;
    for (let i = 0; i < state.depositAmounts.length; i++) {
        if (total > state.depositAmounts[i].toNumber()) {
            total -= state.depositAmounts[i].toNumber();
        } else {
            index = i;
            valid = 1;
            break;
        }
    }
    if (valid != 1) return;
    io.emit("gameEnded", {
        winner: state.entrants[index].toBase58(),
        resultHeight: randPosition / totalDeposit
    }
    );
    const tx = new Transaction();

    tx.add(program.instruction.claimReward(
        bump, {
        accounts: {
            admin: userAddress,
            gamePool,
            winner: state.entrants[index],
            solVault,
            systemProgram: SystemProgram.programId,
        },
        instructions: [],
        signers: [],
    }));

    return tx;

}

export const getResult = async (
    gameKey: PublicKey
) => {
    try {
        const firstResult = await getStateByKey(gameKey);
        const gameInfo = [];
        for (let i = 0; i < firstResult.entrants.length; i++) {
            gameInfo.push({
                player: firstResult.entrants[i].toBase58(),
                amount: firstResult.depositAmounts[i].toNumber()
            })
        }
        return gameInfo;
    } catch {
        return null;
    }
}

export const getStateByKey = async (
    gameKey: PublicKey
): Promise<GamePool | null> => {
    try {
        const gameState = await program.account.gamePool.fetch(gameKey);
        return gameState as unknown as GamePool;
    } catch {
        return null;
    }
}

export const sleep = (time: number) => {
    return new Promise(resolve => setTimeout(resolve, time))
}


export interface GamePool {
    startTs: anchor.BN,
    rand: anchor.BN,
    totalDeposit: anchor.BN,
    claimed: anchor.BN,
    winner: PublicKey,
    entrants: PublicKey[],
    depositAmounts: anchor.BN[]
}