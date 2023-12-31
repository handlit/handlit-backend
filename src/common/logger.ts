import { createLogger, format, transports } from 'winston';
const winstonDaily = require('winston-daily-rotate-file');

const { combine, timestamp, printf } = format;

//* log 출력 포맷 정의 함수
const logFormat = printf(({ level, message, label, timestamp }) => {
  if (typeof message === 'object') {
    message = `\n${JSON.stringify(message, null, 3)}`
  }
  return `${timestamp} ${level} ${message}`; // 날짜 [시스템이름] 로그레벨 메세지
});

const logger = createLogger({
  level: process.env.NODE_ENV === 'dev' ? 'debug' : 'info',
  //* 로그 출력 형식 정의
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.prettyPrint(),
    format.splat(),
    logFormat
  ),
  //* 실제 로그를 어떻게 기록을 한 것인가 정의
  transports: [
    //* info 레벨 로그를 저장할 파일 설정 (info: 2 보다 높은 error: 0 와 warn: 1 로그들도 자동 포함해서 저장)
    new winstonDaily({
      level: 'info', // info 레벨에선
      datePattern: 'YYYY-MM-DD', // 파일 날짜 형식
      dirname: 'logs',
      filename: `info.%DATE%.log`, // 파일 이름
      maxFiles: 30, // 최근 30일치 로그 파일을 남김
      zippedArchive: true, // 아카이브된 로그 파일을 gzip으로 압축할지 여부
    }),
    //* error 레벨 로그를 저장할 파일 설정 (info에 자동 포함되지만 일부러 따로 빼서 설정)
    new winstonDaily({
      level: 'error', // error 레벨에선
      datePattern: 'YYYY-MM-DD',
      dirname: 'logs/error', // /logs/error 하위에 저장
      filename: `error.%DATE%.log`, // 에러 로그는 2020-05-28.error.log 형식으로 저장
      maxFiles: 30,
      zippedArchive: true,
    }),
  ],
  // * uncaughtException 발생시 파일 설정
  exceptionHandlers: [
    new winstonDaily({
      level: 'error',
      datePattern: 'YYYY-MM-DD',
      dirname: 'logs/exception',
      filename: `exception.%DATE%.log`,
      maxFiles: 30,
      zippedArchive: true,
    }),
  ],
})

if (process.env.NODE_ENV !== 'live') {
  logger.add(
    new transports.Console({
      format: format.combine(format.colorize(), logFormat),
    }),
  );
}

export default logger

