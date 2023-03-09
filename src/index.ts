import express from 'express';
import http from 'http';
import bodyParser from 'body-parser';
import cors from 'cors';
import {
  Connection,
  PublicKey
} from '@solana/web3.js';
import { Server } from 'socket.io';
import { addMessageIx,  getLastMsgIx,  getLastPdaIx, getResult, performTx } from './script';
import { getLastMessage } from './db';


export const SOLANA_NETWORK = "https://delicate-withered-theorem.solana-devnet.quiknode.pro/0399d35b8b5de1ba358bd014f584ba88d7709bcf/";
export const solConnection = new Connection(SOLANA_NETWORK, "confirmed");
export const PROGRAM_ID = "E13jNxzoQbUuyaZ9rYJUdRAirYZKU75NJNRV9CHdDhHE";

const app = express();
const port = process.env.PORT || 3002;
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

let counter = 0;
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.on('connection', async (socket) => {
  console.log("New Connection Established,ADD SOCKET");
  counter ++;
  io.emit("connectionUpdated", counter);
  socket.on('disconnect', async (socket) => {
    console.log("New Connection Established, REMOVE COUTNER__");
    counter --;
    io.emit("connectionUpdated", counter);
  })
})

app.post('/writeMessage', async (req, res) => {
  try {
    let user = req.body.user as string;
    let msg = req.body.msg as string;

    let conq;
    const ts = new Date().getTime();
    let result = await getLastMsgIx();
    if (!result) result = [];
    let midResult = await addMessageIx(user, msg);
    let newMsg;
    if (!midResult){
      newMsg = {
        user_name:user,
        message: msg,
        timestamp: ts,
      };
    }
    conq = [newMsg??newMsg, ...result];

    // send data with socket
    io.emit("chatUpdated", conq);

    res.send(JSON.stringify(conq ? conq : -200));
    return

  } catch (e) {
    console.log(e, ">> error occured from receiving deposit request");
    res.send(JSON.stringify(-1));
    return
  }
})

app.get('/getMessage', async (req, res) => {
  try {
    let result = await getLastMsgIx();

    res.send(JSON.stringify(result ? result : -200));
    return

  } catch (e) {
    console.log(e, ">> error occured from receiving deposit request");
    res.send(JSON.stringify(-1));
    return
  }
})

app.post('/createGame', async (req, res) => {
  try {
    const txId = req.body.txId as string;

    console.log(txId);

    if (!txId) {
      res.send(JSON.stringify(-100))
      return
    }

    const result = await performTx(txId, io);
    res.send(JSON.stringify(result ? 0 : -200));

  } catch (e) {
    console.log(e, ">>> Error");
    res.send(JSON.stringify(-2));
    return
  }
})


app.post('/enterGame', async (req, res) => {
  try {
    const txId = req.body.txId as string;

    console.log(txId);

    if (!txId) {
      res.send(JSON.stringify(-100))
      return
    }
    const result = await performTx(txId, io);
    res.send(JSON.stringify(result ? 0 : -200));

  } catch (e) {
    console.log(e, ">>> Error");
    res.send(JSON.stringify(-2));
    return
  }
})


app.get('/getRecentGame', async (req, res) => {
  try {

    const pdaData = await getLastPdaIx();
    if (!pdaData) return;
    const pdaAddress = pdaData.pda;
    let gameData: any
    if (pdaData.pda != "") {
      gameData = await getResult(new PublicKey(pdaAddress));

    }
    const result = {
      pda: pdaData.pda,
      endTimestamp: pdaData.endTime ? pdaData.endTime : 0,
      players: gameData
    }
    res.send(JSON.stringify(result ? result : -200));
  } catch (e) {
    console.log(e, ">>> Error");
    res.send(JSON.stringify(-2));
    return
  }
})


server.listen(port, () => {
  console.log(`server is listening on ${port}`);
  // attachRewardTransactionListener(io);
  return;
});

