import {CommonResponse} from "./CommonResponse";

export interface DataResponse<T> extends CommonResponse {
  value: T;
}

export interface DataResponseList<T> extends CommonResponse {
  value: {
    list: Array<T>
  };
}
