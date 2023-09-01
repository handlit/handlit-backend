
// Errors.ts
export class TelegramErrors {
  error: boolean;
  status: number;
  code: string;
  errorName: string;

  constructor(method: string, error: { _:string, error_code: number, error_message: string }) {
    this.error = true;
    this.errorName = error.error_message;
    this.code = `${method} ${error._}`;
    this.status = error.error_code;
  }
}
