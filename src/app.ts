import dotenv from 'dotenv';
console.log('NODE_ENV:', process.env.NODE_ENV);
dotenv.config({ path: `.env.${process.env.NODE_ENV || 'dev'}` });
import express, {Application} from 'express';
import cors from 'cors';
// express 애플리케이션을 생성합니다.

const app: Application = express();
const port = process.env.PORT;

// morgan 미들웨어를 사용하도록 설정합니다.
const indexRouter = require('./routes/index');
app.use('/', indexRouter);


app.listen(port, () => {
  console.log(`Decacorn ext server listening at http://localhost:${port}`);
});
