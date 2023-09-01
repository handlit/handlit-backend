export interface ErrorData {
  status: number;
  code: string;
  message: string;

}
export const NOT_FOUND_USER: ErrorData = { status: 404, code: 'NOT_FOUND_USER', message: '사용자 정보를 찾을 수 없어요'}
export const UNAUTHORIZED: ErrorData = { status: 401, code: 'UNAUTHORIZED', message: '인증을 실패 했습니다.'}
export const UNKNOWN_ERROR: ErrorData = { status: 500, code: 'UNKNOWN_ERROR', message: '알 수 없는 오류가 발생했어요.'}

// Errors.ts
export class DecaError {
  error: boolean;
  status: number;
  code: string;
  errorName: string;

  constructor(errorName: string = '확인이 필요합니다.') {
    this.error = true;
    this.errorName = errorName;
    this.code = 'DecaError';
    this.status = 500;
  }
}
