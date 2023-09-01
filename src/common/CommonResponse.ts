import { Response } from "express";
import {DataResponse, DataResponseList} from "../types/DataResponse";
import {CommonResponse} from "../types/CommonResponse";
import axios from "axios";

export const sendResponse = <T>(res: Response, data?: T ) => {
    try {
        if (data) {
            const response: DataResponse<T> = {
                error: false,
                value: data,
            };
            res.json(response);
        } else {
            const response: CommonResponse = {
                error: false
            };
            res.json(response);
        }
    } catch (error) {
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
}
export const sendResponseList = <T>(res: Response, data?: Array<T> ) => {
    try {
        if (data) {
            const response: DataResponseList<T> = {
                error: false,
                value: {
                    list: data
                },
            };
            res.json(response);
        } else {
            const response: CommonResponse = {
                error: false
            };
            res.json(response);
        }
    } catch (error) {
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
}
