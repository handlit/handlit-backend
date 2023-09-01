import 'express';

declare module 'express' {
  export interface Request {
    user?: any; // 'any'를 사용하거나 사용자 정의 타입을 사용하여 'cachedData' 프로퍼티의 타입을 지정할 수 있습니다.
    userId?: string;
    email?: string;
    uuid?: string;
  }
}
