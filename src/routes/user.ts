import { NextFunction, Request, Response, Router } from "express";
import { sendResponse } from "../common/CommonResponse";
import { sendError } from "../common/SendError";
import MyCard, {
  createCard,
  getMyCard,
  getMyCardById,
  IMyCard,
} from "../models/MyCard";
import authToken from "../middleware/authToken";
import { generateCardQR, getMyCardImage } from "../service/CardService";
import { createTelegramClass } from "../module/Telegram";
import path from "path";
import * as fs from "fs";
import MyUser, {
  getUserByTelegramId,
  isUserExistByTelegramId,
} from "../models/MyUser";
import MyFriend, { IMyFriend } from "../models/MyFriend";
const puppeteer = require("puppeteer");
const router = Router();
import { v4 as uuidv4 } from "uuid";
import multer from "multer";
import ContractConnector from "./../contract/ContractConnector";
import IpfsProvider from "./../contract/IpfsProvider";
import {uniRepAttest} from "../module/UniRep";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: Number(process.env.UPLOAD_FILE_SIZE_LIMIT) * 1024 * 1024,
  },
});

/**
 * #3000 회원 기본 정보 조회
 */
router.get("/", authToken, async (req: Request, res: Response) => {
  try {
    const userId = req.userId as string;
    const authFilePath = path.resolve(
      __dirname,
      `../../logs/telegram/${userId}.json`
    );
    const isAuth = await new Promise((resolve, reject) => {
      fs.access(authFilePath, fs.constants.F_OK, (err) => {
        if (err) {
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });

    if (!isAuth) {
      sendResponse(res, {
        isAuth: false,
      });
      return;
    }

    const myUser = await MyUser.findOne({ userId: userId });
    sendResponse(res, {
      isAuth: isAuth,
      user: myUser,
    });
  } catch (e) {
    sendError(res, e);
  }
});
/**
 * #3010 Wallet Address 등록
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const walletAddress = req.body.walletAddress as string;
    const userData = await MyUser.findOne({ walletAddress: walletAddress });
    let userToken = "";
    if (!userData) {
      userToken = uuidv4();
      await MyUser.create({
        userId: userToken,
        walletAddress: walletAddress,
      });
    } else {
      userToken = userData.userId;
    }

    const myUser = await MyUser.findOne({ userId: userToken });
    sendResponse(res, {
      userToken: userToken,
    });
  } catch (e) {
    sendError(res, e);
  }
});

/**
 * #4000 카드 정보 등록
 */
router.post(
  "/card",
  authToken,
  upload.array("files", 10),
  async (req: Request, res: Response) => {
    try {
      const userId = req.userId as string;
      const userData = await MyUser.findOne({ userId: userId });
      // userData.walletAddress
      const { name, email, company, title, description } = req.body;
      let loopCount = 0;
      let faceImageBase64;
      let cardImageBase64;
      for (const file of req.files as Express.Multer.File[]) {
        // Based on your logic, I'm assuming you want to store every file as cardImageBase64
        // You may need to modify this part if you want to store multiple images differently
        if (loopCount === 0) {
          faceImageBase64 = file.buffer.toString("base64");
        } else if (loopCount === 1) {
          cardImageBase64 = file.buffer.toString("base64");
        }
        loopCount++;
      }

      const ipfsProvider = new IpfsProvider();
      const contractConnector = new ContractConnector();

      const imgUri = await ipfsProvider.uploadImg(cardImageBase64);
      const metaUri = await ipfsProvider.uploadSBTMetadata(name, imgUri);
      const isSuccess = await contractConnector.mintCard(userData!.walletAddress, metaUri);

      await createCard({
        userId,
        name,
        email,
        company,
        title,
        description,
        cardImageBase64,
        faceImageBase64,
      } as IMyCard);

      sendResponse(res);
    } catch (e) {
      sendError(res, e);
    }
  },
  (error: any, req: Request, res: Response, next: NextFunction) => {
    // Handle Multer error
    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        sendError(
          res,
          new Error(
            `Limit file size is ${process.env.UPLOAD_FILE_SIZE_LIMIT}MB`
          )
        );
      } else {
        sendError(res, error);
      }
    } else {
      // Handle any other errors
      next(error);
    }
  }
);

/**
 * #4001 카드 정보 MINT
 */
router.post("/card/:cardId", authToken, async (req: Request, res: Response) => {
  try {
    const userId = req.userId as string;
    const cardId = req.params.cardId;
    const card = await getMyCardById(cardId);
    card.isMinted = true;
    await card.save();

    sendResponse(res);
  } catch (e) {
    sendError(res, e);
  }
});

/**
 * #4010 카드 목록 조회
 */
router.get("/card", authToken, async (req: Request, res: Response) => {
  try {
    const userId = req.userId as string;
    const cardList = await getMyCard(userId);
    sendResponse(res, {
      list: cardList.map((card) => {
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
        };
      }),
    });
  } catch (e) {
    sendError(res, e);
  }
});

/**
 * #4020 카드 이미지
 */
router.get('/card/:cardId/face', async (req: Request, res: Response) => {
  try {
    const cardId = req.params.cardId;
    const card =  await getMyCardById(cardId);
    const base64Image = card.faceImageBase64;

    if (!base64Image) {
      throw new Error('No base64Image')
    }
    // base64 이미지를 Buffer로 변환
    const imageBuffer = Buffer.from(base64Image, 'base64');

    res.setHeader('Content-Disposition', 'attachment;filename="businessCard.png"');
    res.setHeader('Content-Type', 'image/png');
    res.send(imageBuffer);
  } catch (e) {
    sendError(res, e);
  }
});


/**
 * #4020 카드 이미지
 */
router.get("/card/:cardId/image", async (req: Request, res: Response) => {
  try {
    const cardId = req.params.cardId;
    const card = await getMyCardById(cardId);
    const base64Image = card.cardImageBase64;

    if (!base64Image) {
      throw new Error("No base64Image");
    }
    // base64 이미지를 Buffer로 변환
    const imageBuffer = Buffer.from(base64Image, "base64");

    res.setHeader(
      "Content-Disposition",
      'attachment;filename="businessCard.png"'
    );
    res.setHeader("Content-Type", "image/png");
    res.send(imageBuffer);
  } catch (e) {
    sendError(res, e);
  }
});

/**
 * #4030 CARD QR 코드 조회
 */
router.get("/card/:cardId/qrcode", async (req: Request, res: Response) => {
  try {
    const cardId = req.params.cardId;
    const bufferedImage = await generateCardQR(
      `${process.env.HOST_URL}/qrcode/${cardId}`
    );
    // 응답 헤더 설정 및 PNG 이미지로 응답
    res.writeHead(200, {
      "Content-Type": "image/png",
      "Content-Length": bufferedImage.length,
    });
    res.end(bufferedImage);
  } catch (e) {
    sendError(res, e);
  }
});

/**
 * #5000 사용자 QR 스캔 정보 조회
 */
router.post("/qr", authToken, async (req: Request, res: Response) => {
  try {
    const userId = req.userId as string;
    const qrData = req.body.qrData as string;
    const telegramId = qrData.split("/").pop() as string;

    const telegram = createTelegramClass(userId);
    const user = await telegram.getUserInfoByUsername(telegramId);
    if (!user) {
      throw new Error("user not found");
    }
    const photoList = await telegram.getUserPhoto(user.id, user.access_hash);
    sendResponse(res, {
      user,
      photoList,
    });
  } catch (error) {
    sendError(res, error);
  }
});

/**
 * #5010 사용자 QR 스캔 정보 조회
 */
router.post(
  "/handleit",
  authToken,
  upload.array("files", 10),
  async (req: Request, res: Response) => {
    try {
      const userId = req.userId as string;
      const { cardId, qrData, hiMessage, sendMySocialToken } = req.body;
      const telegramName = qrData.split("/").pop() as string;

      const userData = await MyUser.findOne({ userId: userId });
      if (!userData) {
        throw new Error("user not found");
      }

      const cardData = await getMyCardById(cardId);
      const telegram = createTelegramClass(userId);

      const friend = await telegram.getUserInfoByUsername(telegramName);
      if (!friend) {
        throw new Error("friend not found");
      }

      const friendUserData = await getUserByTelegramId(friend.id);
      let friendCardId = "";
      if (friendUserData) {
        const friendCardList = await getMyCard(friendUserData.userId);
        if (friendCardList.length > 0) {
          friendCardId = friendCardList[0]._id;
        }
      }

      let photoList = [];
      for (const file of req.files as Express.Multer.File[]) {
        photoList.push(file.buffer.toString("base64"));
      }

      if (friendUserData) {
        await MyFriend.create({
          userId: friendUserData.userId,
          myCardId: friendCardId,
          friendId: userId,
          friendCardId: cardId,
          hiMessage: hiMessage,
          picture: photoList,
          firstName: userData.firstName,
          lastName: userData.lastName,
          userName: userData.userName,
          accessHash: userData.accessHash,
          telegramId: userData.telegramId,
          telegramPhotoId: userData.telegramPhotoId,
        } as IMyFriend);
      }

      await MyFriend.create({
        userId: userId,
        myCardId: cardId,
        friendId: friendUserData?.userId ?? "",
        friendCardId: friendCardId,
        hiMessage: hiMessage,
        picture: photoList,
        firstName: friend.first_name,
        lastName: friend.last_name,
        userName: friend.username,
        accessHash: friend.access_hash,
        telegramId: friend.id,
        telegramPhotoId: friend.photo?.photo_id,
      } as IMyFriend);

      const inputFile = await telegram.uploadMediaByBase64(
        cardData.cardImageBase64
      );
      await telegram.sendMedia(friend.id, friend.access_hash, inputFile);
      for (let photo of photoList) {
        const inputFile = await telegram.uploadMediaByBase64(photo);
        await telegram.sendMedia(friend.id, friend.access_hash, inputFile);
      }
      await telegram.sendMessage(
        friend.id,
        friend.access_hash,
        `Name: ${userData.userName}
Company: ${cardData.company}
Title: ${cardData.title}
Email: ${cardData.email}
Don’t use folder, Now Handlit : (link)`
      );

      await uniRepAttest('821097762484', {
        0: 1,
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0
      }, 0)

      const ipfsProvider = new IpfsProvider();
      const contractConnector = new ContractConnector();

      // const imgUri = await ipfsProvider.uploadImg(cardImageBase64);
      const imgUri = "https://images.unsplash.com/photo-1618401479427-c8ef9465fbe1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1443&q=80";
      const metaUri = await ipfsProvider.uploadSBTMetadata(name, imgUri);
      if (friendUserData) {
        const isSuccess = await contractConnector.mintSocialToken(userData!.walletAddress, friendUserData.walletAddress, metaUri);
      }

      sendResponse(res);
    } catch (error) {
      sendError(res, error);
    }
  }
);

/**
 * #5020 명함 교환 내역
 */
router.get("/handleit", authToken, async (req: Request, res: Response) => {
  try {
    const userId = req.userId as string;
    const friendList = await MyFriend.aggregate([
      {
        $match: {
          userId: userId,
          friendCardId: { $ne: "" },
        },
      },
      {
        $addFields: {
          convertedObjectId: { $toObjectId: "$friendCardId" }, // friendCardId를 ObjectId로 변환
        },
      },
      {
        $lookup: {
          from: "my_cards", // 조인할 컬렉션 이름
          localField: "convertedObjectId", // MyFriend 컬렉션의 조인 필드
          foreignField: "_id", // MyCard 컬렉션의 조인 대상 필드
          as: "friendCard", // 조인 결과를 담을 필드 이름
        },
      },
      {
        $unwind: "$friendCard", // ownerUser의 배열을 개별 객체로 변환
      },
    ]);

    sendResponse(res, {
      list: friendList.map((friend) => {
        const card = friend.friendCard as IMyCard;
        return {
          id: card._id,
          name: card.name,
          email: card.email,
          company: card.company,
          title: card.title,
          description: card.description,
          imageUrl: `${process.env.HOST_URL}/user/card/${card._id}/image`,
          faceUrl: `${process.env.HOST_URL}/user/card/${card._id}/face`,
          qrCodeUrl: `${process.env.HOST_URL}/user/card/${card._id}/qrcode`,
          isMinted: card.isMinted,
        };
      }),
    });
  } catch (error) {
    sendError(res, error);
  }
});

module.exports = router;
export default class indexRouter {}
