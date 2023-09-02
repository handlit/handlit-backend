import {Request, Response, Router} from "express";
import {sendResponse} from "../common/CommonResponse";
import {sendError} from "../common/SendError";
import authToken from "../middleware/authToken";
import path from "path";
import * as fs from "fs";
import MyUser from "../models/MyUser";
import {createCard, getMyCard, getMyCardById, IMyCard} from "../models/MyCard";

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

/**
 * #4000 카드 정보 등록
 */
router.post('/card', authToken, async (req: Request, res: Response) => {
  try {
    const userId = req.userId as string
    const { name, email, company, title, description, cardImageBase64, faceImageBase64 } = req.body;
    await createCard({ userId, name, email, company, title, description, cardImageBase64, faceImageBase64 } as IMyCard);
    sendResponse(res);
  } catch (e) {
    sendError(res, e)
  }
});
/**
 * #4001 카드 정보 MINT
 */
router.post('/card/:cardId', authToken, async (req: Request, res: Response) => {
  try {
    const userId = req.userId as string
    const cardId = req.params.cardId;
    const card = await getMyCardById(cardId)
    card.isMinted = true
    await card.save()

    sendResponse(res);
  } catch (e) {
    sendError(res, e)
  }
});

/**
 * #4010 카드 목록 조회
 */
router.get('/card', authToken, async (req: Request, res: Response) => {
  try {
    const userId = req.userId as string
    const cardList =  await getMyCard(userId);
    sendResponse(res, {
      list: cardList.map(card => {
        return {
          id: card._id,
          name: card.name,
          email: card.email,
          company: card.company,
          title: card.title,
          description: card.description,
          imageUrl: `${process.env.HOST_URL}/user/card/${card._id}/image`,
          qrCodeUrl: `${process.env.HOST_URL}/user/card/${card._id}/qrcode`,
          isMinted: card.isMinted,
        }
      })
    });
  } catch (e) {
    sendError(res, e)
  }
});

module.exports = router;
export default class indexRouter {
}
