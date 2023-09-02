import {Request, Response, Router} from "express";
import {sendResponse} from "../common/CommonResponse";
import {createTelegramClass} from "../module/Telegram";
import {sendError} from "../common/SendError";
import multer from "multer";
import MyUser from "../models/MyUser";
import authToken from "../middleware/authToken";
import MyFriend from "../models/MyFriend";
import * as fs from "fs";

const router = Router();


router.get('/getNearestDc', async (req: Request, res: Response) => {
  const telegram = createTelegramClass()
  const result = await telegram.getNearestDc()
  sendResponse(res, result)
});

/**
 * #2000 텔레그램 인증코드요청 - 휴대폰번호 입력
 */
router.post('/authSendCode', authToken, async (req: Request, res: Response) => {
  try {
    const userId = req.userId as string
    const phone = req.body.phone as string
    sendResponse(res)

    const telegram = createTelegramClass(userId)
    await telegram.authSendCode(userId, phone)
  } catch (error) {
    sendError(res, error );
  }
});

/**
 * #2010 텔레그램 인증코드확인
 */
router.post('/authSignIn', authToken, async (req: Request, res: Response) => {
  try {
    const userId = req.userId as string
    const { code } = req.body;

    const telegram = createTelegramClass(userId)
    const result = await telegram.authSignIn(userId, code);

    if (result) {
      const telegramId = result.user.id as string;

      await MyUser.findOneAndUpdate({userId: userId},
        {
          $set: {
            phone: result.user.phone as string,
            firstName: result.user.first_name as string,
            lastName: result.user.last_name as string,
            userName: result.user.username as string,
            accessHash: result.user.access_hash as string,
            telegramId: telegramId,
            telegramPhotoId: result.photo?.photo_id as string,
          }
        }, {upsert: true})

      await MyFriend.updateMany({telegramId}, {
        $set: {
          friendId: userId,
          isNewFriendMessage: true
        }
      });
    }

    sendResponse(res, result)
  } catch (error) {
    sendError(res, error );
  }
});

router.post('/user', authToken, async (req: Request, res: Response) => {
  try {
    const telegramUrl = req.body.telegramUrl as string
    const telegramId = telegramUrl.split('/').pop() as string;
    const { username } = req.params;

    const telegram = createTelegramClass(telegramId)
    const user = await telegram.getUserInfoByUsername(username);
    sendResponse(res, user)
  } catch (error) {
    sendError(res, error );
  }
});

router.post('/message', authToken, async (req: Request, res: Response) => {
  try {
    const userId = req.userId as string
    const { username, message } = req.body;

    const telegram = createTelegramClass(userId)
    const user = await telegram.getUserInfoByUsername(username);
    if(!user) {
      throw new Error('user not found')
    }

    const result = telegram.sendMessage(user.id, user.access_hash, message)
    sendResponse(res, result)
  } catch (error) {
    sendError(res, error );
  }
});

router.post('/photo', authToken, async (req: Request, res: Response) => {
  try {
    const userId = req.userId as string
    const { id, accessHash } = req.body;

    const telegram = createTelegramClass(userId)
    const imageBuffer = await telegram.getUserPhoto(id, accessHash);
    if(!imageBuffer) {
      throw new Error('photo not found')
    }

    // JPEG 헤더 추가
    const fullImageData = expandInlineBytes(imageBuffer);

    fs.writeFileSync('output123.jpg', fullImageData);
    res.writeHead(200, {
      'Content-Type': 'image/jpeg',
      'Content-Length': fullImageData.length
    });
    res.end(fullImageData);
  } catch (error) {
    sendError(res, error );
  }
});

function expandInlineBytes(bytes: any) {
  if (bytes.length < 3 || bytes[0] !== 0x01) {
    return Buffer.alloc(0);
  }

  const header = Buffer.from(
  "\xff\xd8\xff\xe0\x00\x10\x4a\x46\x49"
  + "\x46\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00\xff\xdb\x00\x43\x00\x28\x1c"
  + "\x1e\x23\x1e\x19\x28\x23\x21\x23\x2d\x2b\x28\x30\x3c\x64\x41\x3c\x37\x37"
  + "\x3c\x7b\x58\x5d\x49\x64\x91\x80\x99\x96\x8f\x80\x8c\x8a\xa0\xb4\xe6\xc3"
  + "\xa0\xaa\xda\xad\x8a\x8c\xc8\xff\xcb\xda\xee\xf5\xff\xff\xff\x9b\xc1\xff"
  + "\xff\xff\xfa\xff\xe6\xfd\xff\xf8\xff\xdb\x00\x43\x01\x2b\x2d\x2d\x3c\x35"
  + "\x3c\x76\x41\x41\x76\xf8\xa5\x8c\xa5\xf8\xf8\xf8\xf8\xf8\xf8\xf8\xf8\xf8"
  + "\xf8\xf8\xf8\xf8\xf8\xf8\xf8\xf8\xf8\xf8\xf8\xf8\xf8\xf8\xf8\xf8\xf8\xf8"
  + "\xf8\xf8\xf8\xf8\xf8\xf8\xf8\xf8\xf8\xf8\xf8\xf8\xf8\xf8\xf8\xf8\xf8\xf8"
  + "\xf8\xf8\xf8\xf8\xf8\xff\xc0\x00\x11\x08\x00\x00\x00\x00\x03\x01\x22\x00"
  + "\x02\x11\x01\x03\x11\x01\xff\xc4\x00\x1f\x00\x00\x01\x05\x01\x01\x01\x01"
  + "\x01\x01\x00\x00\x00\x00\x00\x00\x00\x00\x01\x02\x03\x04\x05\x06\x07\x08"
  + "\x09\x0a\x0b\xff\xc4\x00\xb5\x10\x00\x02\x01\x03\x03\x02\x04\x03\x05\x05"
  + "\x04\x04\x00\x00\x01\x7d\x01\x02\x03\x00\x04\x11\x05\x12\x21\x31\x41\x06"
  + "\x13\x51\x61\x07\x22\x71\x14\x32\x81\x91\xa1\x08\x23\x42\xb1\xc1\x15\x52"
  + "\xd1\xf0\x24\x33\x62\x72\x82\x09\x0a\x16\x17\x18\x19\x1a\x25\x26\x27\x28"
  + "\x29\x2a\x34\x35\x36\x37\x38\x39\x3a\x43\x44\x45\x46\x47\x48\x49\x4a\x53"
  + "\x54\x55\x56\x57\x58\x59\x5a\x63\x64\x65\x66\x67\x68\x69\x6a\x73\x74\x75"
  + "\x76\x77\x78\x79\x7a\x83\x84\x85\x86\x87\x88\x89\x8a\x92\x93\x94\x95\x96"
  + "\x97\x98\x99\x9a\xa2\xa3\xa4\xa5\xa6\xa7\xa8\xa9\xaa\xb2\xb3\xb4\xb5\xb6"
  + "\xb7\xb8\xb9\xba\xc2\xc3\xc4\xc5\xc6\xc7\xc8\xc9\xca\xd2\xd3\xd4\xd5\xd6"
  + "\xd7\xd8\xd9\xda\xe1\xe2\xe3\xe4\xe5\xe6\xe7\xe8\xe9\xea\xf1\xf2\xf3\xf4"
  + "\xf5\xf6\xf7\xf8\xf9\xfa\xff\xc4\x00\x1f\x01\x00\x03\x01\x01\x01\x01\x01"
  + "\x01\x01\x01\x01\x00\x00\x00\x00\x00\x00\x01\x02\x03\x04\x05\x06\x07\x08"
  + "\x09\x0a\x0b\xff\xc4\x00\xb5\x11\x00\x02\x01\x02\x04\x04\x03\x04\x07\x05"
  + "\x04\x04\x00\x01\x02\x77\x00\x01\x02\x03\x11\x04\x05\x21\x31\x06\x12\x41"
  + "\x51\x07\x61\x71\x13\x22\x32\x81\x08\x14\x42\x91\xa1\xb1\xc1\x09\x23\x33"
  + "\x52\xf0\x15\x62\x72\xd1\x0a\x16\x24\x34\xe1\x25\xf1\x17\x18\x19\x1a\x26"
  + "\x27\x28\x29\x2a\x35\x36\x37\x38\x39\x3a\x43\x44\x45\x46\x47\x48\x49\x4a"
  + "\x53\x54\x55\x56\x57\x58\x59\x5a\x63\x64\x65\x66\x67\x68\x69\x6a\x73\x74"
  + "\x75\x76\x77\x78\x79\x7a\x82\x83\x84\x85\x86\x87\x88\x89\x8a\x92\x93\x94"
  + "\x95\x96\x97\x98\x99\x9a\xa2\xa3\xa4\xa5\xa6\xa7\xa8\xa9\xaa\xb2\xb3\xb4"
  + "\xb5\xb6\xb7\xb8\xb9\xba\xc2\xc3\xc4\xc5\xc6\xc7\xc8\xc9\xca\xd2\xd3\xd4"
  + "\xd5\xd6\xd7\xd8\xd9\xda\xe2\xe3\xe4\xe5\xe6\xe7\xe8\xe9\xea\xf2\xf3\xf4"
  + "\xf5\xf6\xf7\xf8\xf9\xfa\xff\xda\x00\x0c\x03\x01\x00\x02\x11\x03\x11\x00"
  + "\x3f\x00", 'binary'
  );

  const footer = Buffer.from("\xff\xd9", 'binary');

  header[164] = bytes[1];
  header[166] = bytes[2];

  const midBytes = Buffer.from(bytes.slice(3));

  return Buffer.concat([header, midBytes, footer]);
}

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: Number(process.env.UPLOAD_FILE_SIZE_LIMIT) * 1024 * 1024 } });
router.post("/picture/:username", authToken, upload.single('file'), async (req: Request, res: Response) => {
  try {
    const userId = req.userId as string
    const { username } = req.params;
    const {file} = req;
    if(!file) {
        throw new Error('file not found')
    }

    const telegram = createTelegramClass(userId)
    const user = await telegram.getUserInfoByUsername(username);
    if(!user) {
      throw new Error('user not found')
    }

    const inputFile = await telegram.uploadMediaByFile(file)
    const result = telegram.sendMedia(user.id, user.access_hash, inputFile)
    sendResponse(res, result)
  } catch (error) {
    sendError(res, error );
  }
});

module.exports = router;
export default class indexRouter {
}
