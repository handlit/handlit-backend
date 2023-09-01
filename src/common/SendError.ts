import {Response} from "express";
import {DecaError, ErrorData} from "./Errors";
import {ErrorResponse} from "../types/ErrorResponse";
import logger from "./logger";
import axios from "axios";
import {TelegramErrors} from "./TelegramErrors";

export const sendError = (res: Response, error: ErrorData | Error | DecaError | any) => {
  try {
    logger.error(error)

    if (error instanceof DecaError || error instanceof TelegramErrors) {
      // 사용자 정의 오류 처리
      const errorResponse: ErrorResponse = {
        error: true,
        errorName: '다음의 내용을 확인 해보세요.',
        errors: [{
          message: error.errorName,
          code: error.code,
        }]
      };
      res.status(error.status).send(errorResponse);
    } else if (error instanceof Error) {
      const errorResponse: ErrorResponse = {
        error: true,
        errorName: '다음의 내용을 확인 해보세요.',
        errors: [{
          message: error.message,
          code: error.name as string,
        }]
      }
      const headers = res.req.headers
      errorResponse.errors.push({
        message: headers['x-deca-device-id'] as string,
        code: 'x-deca-device-id',
      })
      errorResponse.errors.push({
        message: error.stack as string,
        code: error.message as string,
      })
      res.status(500).send(errorResponse);
    } else {
      const errorResponse: ErrorResponse = {
        error: true,
        errorName: '다음의 내용을 확인 해보세요.',
        errors: [{
          message: error.message,
          code: error.code,
        }]
      }
      res.status(500).send(errorResponse);
    }
  } catch (e) {
    console.log(error);
    const slackMessage = {
      text: JSON.stringify({
        url: res.req?.baseUrl,
        method: res.req?.method,
        message: error,
      }),
    };
    axios.post(process.env.SLACK_ERROR_URL as string, slackMessage).then(() => {});
  }
};
