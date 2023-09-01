import {CommonResponse} from "./CommonResponse";
export interface ErrorResponse extends CommonResponse {
  errorName: string;
  errors: [{
    message: string;
    code: string;
  }];
  stack?: string;
}
