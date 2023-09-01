import {Request, Response, Router} from "express";
import {sendResponse} from "../common/CommonResponse";
import {sendError} from "../common/SendError";
import authToken from "../middleware/authToken";
import path from "path";
import * as fs from "fs";
import MyUser from "../models/MyUser";

const router = Router();

/**
 * #3000 회원 기본 정보 조회
 */
router.get('/', authToken, async (req: Request, res: Response) => {
  try {
    const userId = req.userId as string
    const authFilePath = path.resolve(__dirname, `../../logs/telegram/${userId}.json`);
    const isAuth = await new Promise((resolve, reject) => {
        fs.access(authFilePath, fs.constants.F_OK, (err) => {
            if (err) {
            resolve(false);
            } else {
            resolve(true);
            }
        });
    })

    if (!isAuth) {
        sendResponse(res, {
            isAuth: false,
        });
        return;
    }

    const myUser = await MyUser.findOne({userId: userId});
    sendResponse(res, {
      isAuth: isAuth,
      user: myUser,
    });
  } catch (e) {
    sendError(res, e)
  }
});

module.exports = router;
export default class indexRouter {
}
