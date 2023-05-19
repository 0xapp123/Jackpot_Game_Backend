import express from "express";
import http from "http";
import bodyParser from "body-parser";
import cors from "cors";
import { Connection, PublicKey } from "@solana/web3.js";
import { Server } from "socket.io";
import {
  addMessageIx,
  getLastMsgIx,
  getLastPdaIx,
  getLastWinnerIx,
  getResult,
  getTimesIx,
  getTotalSumIx,
  performTx,
} from "./script";
import { getLastMessage, getLastPda } from "./db";
import {
  decreasePendingCount,
  getPendingCount,
  getProcessingStatus,
  increasePendingCount,
  resetPendingCount,
  setProcessingStatus,
} from "../config";

export const SOLANA_NETWORK =
  "https://delicate-withered-theorem.solana-devnet.quiknode.pro/0399d35b8b5de1ba358bd014f584ba88d7709bcf/";
export const solConnection = new Connection(SOLANA_NETWORK, "confirmed");

const app = express();
const port = process.env.PORT || 3002;
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

let counter = 0;
let betCounter = 0;

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", async (socket) => {
  console.log(" --> ADD SOCKET", counter);
  counter++;
  io.emit("connectionUpdated", counter);
  socket.on("disconnect", async (socket) => {
    console.log(" --> REMOVE SOCKET", counter);
    counter--;
    io.emit("connectionUpdated", counter);
  });
});

app.post("/requestCreate", async (req, res) => {
  console.log("----> Request Create");
  if (getProcessingStatus()) {
    res.status(503).send("Already creating game. Wait for seconds");
    return;
  }
  const pdaData = await getLastPda();
  console.log("  Last Game PDA:", pdaData?.pda);
  if (pdaData.pda) {
    res
      .status(503)
      .send("Exist already created game. Try refresh and enter game");
    return;
  }
  setProcessingStatus(true);
  resetPendingCount();
  res.status(200).send("");
});
app.post("/endRequest", async (req, res) => {
  console.log("----> End Create Request");
  setProcessingStatus(false);
  res.status(200).send("");
});
app.post("/requestEnter", async (req, res) => {
  console.log("----> Request Enter");
  if (getProcessingStatus()) {
    res.status(503).send("Already finishing game. Wait for next round");
    return;
  }
  increasePendingCount();
  res.status(200).send("");
});
app.post("/endEnterRequest", async (req, res) => {
  console.log("----> End Enter Request");
  decreasePendingCount();
  res.status(200).send("");
});

app.post("/writeMessage", async (req, res) => {
  try {
    let user = req.body.user as string;
    let msg = req.body.msg as string;

    let conq;
    const ts = new Date().getTime();
    let result = await getLastMsgIx();
    if (!result) result = [];
    let midResult = await addMessageIx(user, msg);
    let newMsg;
    if (!midResult) {
      newMsg = {
        user_name: user,
        message: msg,
        timestamp: ts,
      };
    }
    conq = [newMsg ?? newMsg, ...result];

    // send data with socket
    io.emit("chatUpdated", conq);

    res.send(JSON.stringify(conq ? conq : -200));
    return;
  } catch (e) {
    console.log(e, ">> error occured from receiving deposit request");
    res.send(JSON.stringify(-1));
    return;
  }
});

app.get("/getMessage", async (req, res) => {
  try {
    let result = await getLastMsgIx();

    res.send(JSON.stringify(result ? result : -200));
    return;
  } catch (e) {
    console.log(e, ">> error occured from receiving deposit request");
    res.send(JSON.stringify(-1));
    return;
  }
});

app.get("/getTimes", async (req, res) => {
  try {
    let result = await getTimesIx();

    res.send(JSON.stringify(result ? result : -200));
    return;
  } catch (e) {
    console.log(e, ">> error occured from receiving deposit request");
    res.send(JSON.stringify(-1));
    return;
  }
});

app.get("/getTotalSum", async (req, res) => {
  try {
    let result = await getTotalSumIx();

    res.send(JSON.stringify(result ? result : -200));
    return;
  } catch (e) {
    console.log(e, ">> error occured from receiving deposit request");
    res.send(JSON.stringify(-1));
    return;
  }
});

app.get("/getWinners", async (req, res) => {
  try {
    let result = await getLastWinnerIx();

    res.send(JSON.stringify(result ? result : -200));
    return;
  } catch (e) {
    console.log(e, ">> error occured from receiving deposit request");
    res.send(JSON.stringify(-1));
    return;
  }
});

app.post("/createGame", async (req, res) => {
  try {
    const txId = req.body.txId as string;
    const encodedTx = req.body.encodedTx as string;
    if (!encodedTx)
        return res.status(400).json({error: "Invalid Request"});
    if (!txId) {
      res.send(JSON.stringify(-100));
      return;
    }

    io.emit("gameStarting", 0);
    console.log(txId);

    betCounter++;

    const result = await performTx(txId, encodedTx, io);
    res.send(JSON.stringify(result ? 0 : -200));
  } catch (e) {
    console.log(e, ">>> Error");
    res.send(JSON.stringify(-2));
    return;
  }
});

app.post("/enterGame", async (req, res) => {
  try {
    const txId = req.body.txId as string;
    const encodedTx = req.body.encodedTx as string;

    console.log(txId);
    if (!encodedTx)
        return res.status(400).json({error: "Invalid Request"});

    if (!txId) {
      res.send(JSON.stringify(-100));
      return;
    }
    betCounter++;
    const result = await performTx(txId, encodedTx, io);
    res.send(JSON.stringify(result ? 0 : -200));
  } catch (e) {
    console.log(e, ">>> Error");
    res.send(JSON.stringify(-2));
    return;
  }
});

app.get("/getBetCount", async (req, res) => {
  try {
    const result = betCounter;

    res.send(JSON.stringify(result ? result : 0));
  } catch (e) {
    console.log(e, ">>> Error");
    res.send(JSON.stringify(-2));
    return;
  }
});

app.get("/getRecentGame", async (req, res) => {
  try {
    const pdaData = await getLastPdaIx();
    if (!pdaData) return;
    const pdaAddress = pdaData.pda;
    let gameData: any;
    if (pdaData.pda != "") {
      gameData = await getResult(new PublicKey(pdaAddress));
      // console.log(" --> getRecentGame:", gameData);
    }
    const result = {
      pda: pdaData.pda,
      endTimestamp: pdaData.endTime ? pdaData.endTime : 0,
      players: gameData,
    };
    res.send(JSON.stringify(result ? result : -200));
  } catch (e) {
    console.log(e, ">>> Error");
    res.send(JSON.stringify(-2));
    return;
  }
});

server.listen(port, () => {
  console.log(`server is listening on ${port}`);
  // attachRewardTransactionListener(io);

  setInterval(() => {
    io.emit("heartbeat", Date.now());
  }, 1000);
  return;
});
