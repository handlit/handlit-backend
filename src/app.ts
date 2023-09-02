import dotenv from 'dotenv';
console.log('NODE_ENV:', process.env.NODE_ENV);
dotenv.config({ path: `.env.${process.env.NODE_ENV || 'dev'}` });
import express, {Application} from 'express';
import 'common/mongo';
import 'common/redis';
import 'types/CommonRequest'
import cors from 'cors';
import {SQLiteConnector} from "anondb/node.js";
import {Synchronizer} from "@unirep/core";
import {
  provider,
  PRIVATE_KEY,
  UNIREP_ADDRESS,
  DB_PATH,
  APP_ADDRESS,
} from './config'
import TransactionManager from "./TransactionManager";
import schema from './schema'
import {uniRepLoad} from "./module/UniRep";

// express 애플리케이션을 생성합니다.

const app: Application = express();
const port = process.env.PORT;

// morgan 미들웨어를 사용하도록 설정합니다.
app.use(express.json())
if (process.env.NODE_ENV === 'dev' || process.env.NODE_ENV === 'stage') {
  // app.use(cors({
  //   origin: ['http://localhost:3000', 'http://localhost:9000', 'https://decacorn.team', 'https://www.decacorn.team', 'https://stage23.decacorn.team', 'https://coffee-stage.decacorn.team']
  // }));
} else {
  // app.use(cors({
  //   origin: ['https://decacorn.team', 'https://www.decacorn.team', 'https://coffee.decacorn.team']
  // }));
}
const indexRouter = require('./routes/index');
const telegramRouter = require('./routes/telegram');
const dataRouter = require('./routes/data');
const userRouter = require('./routes/user');
const unirepRouter = require('./routes/unirep');
app.use('/', indexRouter);
app.use('/telegram', telegramRouter);
app.use('/data', dataRouter);
app.use('/user', userRouter);
app.use('/unirep', unirepRouter);

app.listen(port, () => {
  console.log(`Decacorn ext server listening at http://localhost:${port}`);
});


SQLiteConnector.create(schema, DB_PATH ?? ':memory:').then(async (db) => {
  try {
    const synchronizer = new Synchronizer({
      db,
      provider,
      unirepAddress: UNIREP_ADDRESS,
      attesterId: BigInt(APP_ADDRESS),
    })

    await synchronizer.start();
    TransactionManager.configure(PRIVATE_KEY, provider, synchronizer.db)
    await TransactionManager.start()
  } catch (e) {
    console.log(e);
  }
})


uniRepLoad('821097762484');
