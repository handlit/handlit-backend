import {NextFunction, Request, Response} from 'express';
import {sendError} from 'common/SendError';
import {DecaError} from 'common/Errors';
import {v4 as uuidv4} from 'uuid';

const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let token = req.headers['x-user-token'] as string;

    if (!token) {
      throw new DecaError('인증을 실패 했습니다.');
    }

    req.userId = token as string;
    req.uuid = uuidv4()

    next();
  } catch (error) {
    console.error('authToken', req.headers.authorization, error)
    sendError(res, error )
  }
};
export default authMiddleware;
