import {TelegramErrors} from "../common/TelegramErrors";
import * as fs from "fs";

const path = require('path');
const MTProto = require('@mtproto/core');
const { sleep } = require('@mtproto/core/src/utils/common');

export const createTelegramClass = (phone: string = 'common') => {
    return new Telegram(phone);
}

const authDataList = {} as any

class Telegram {
    private mtproto: any;

    constructor(userId: string) {
        this.mtproto = new MTProto({
            api_id: '21170645',
            api_hash: 'ee7b93d7fb773da49532250360071570',

            storageOptions: {
                path: path.resolve(__dirname, `../../logs/telegram/${userId}.json`),
            },
        });

        this.mtproto.updates.on('updatesTooLong', (updateInfo: any) => {
            console.log('updatesTooLong:', updateInfo);
        });

        this.mtproto.updates.on('updateShortMessage', (updateInfo: any) => {
            console.log('updateShortMessage:', updateInfo);
        });

        this.mtproto.updates.on('updateShortChatMessage', (updateInfo: any) => {
            console.log('updateShortChatMessage:', updateInfo);
        });

        this.mtproto.updates.on('updateShort', (updateInfo: any) => {
            console.log('updateShort:', updateInfo);
        });

        this.mtproto.updates.on('updatesCombined', (updateInfo: any) => {
            console.log('updatesCombined:', updateInfo);
        });

        this.mtproto.updates.on('updates', (updateInfo: any) => {
            console.log('updates:', updateInfo);
        });

        this.mtproto.updates.on('updateShortSentMessage', (updateInfo: any) => {
            console.log('updateShortSentMessage:', updateInfo);
        });

    }

    async call(method: string, params: any = {}, options = {}): Promise<any> {
        try {
            return await this.mtproto.call(method, params, options);
        } catch (error) {
            console.log(`${method} error:`, error);

            const { error_code, error_message } = error as { error_code: number, error_message: string };

            if (error_code === 420) {
                const seconds = Number(error_message.split('FLOOD_WAIT_')[1]);
                const ms = seconds * 1000;

                await sleep(ms);

                return this.call(method, params, options);
            }

            if (error_code === 303) {
                const [type, dcIdAsString] = error_message.split('_MIGRATE_');

                const dcId = Number(dcIdAsString);

                // If auth.sendCode call on incorrect DC need change default DC, because
                // call auth.signIn on incorrect DC return PHONE_CODE_EXPIRED error
                if (type === 'PHONE') {
                    await this.mtproto.setDefaultDc(dcId);
                } else {
                    Object.assign(options, { dcId });
                }

                return this.call(method, params, options);
            }

            throw new TelegramErrors(method, error as any);
        }
    }

    async getNearestDc() {
        return await this.call('help.getNearestDc');
    }

    async authSendCode(userId: string, phone: string) {
        const result = await this.call('auth.sendCode',
          {
              phone_number: phone,
              settings: {
                  _: 'codeSettings',
              }
          });
        authDataList[userId] = {
            ...result,
            phone
        }
    }

    async authSignIn(userId: string, code: string) {
        const { phone, phone_code_hash } = authDataList[userId];
        const result = await this.call('auth.signIn',
            {
                phone_number: phone,
                phone_code_hash: phone_code_hash,
                phone_code: code,
            });
        return {
            ...result,
            phone
        }
    }

    async getUserInfoByUsername (username: string) {
        const result = await this.call('contacts.resolveUsername', {
            username: username
        });

        if (result._ === 'contacts.resolvedPeer' && result.peer._ === 'peerUser') {
            return result.users[0];
        }
        return null;
    }
    async getUserPhoto(userId: string, accessHash: string) {
        const result = await this.call('photos.getUserPhotos', {
            user_id: {
                _: 'inputUser',
                user_id: userId,
                access_hash: accessHash
            },
            offset: 0,
            max_id: 0,
            limit: 100
        });

        if (result._ === 'photos.photos' && result.photos.length > 0) {
            const photoStrippedSizes = result.photos[0].sizes.filter((size: any) => size._ === 'photoStrippedSize')
                .map((size: any) => Object.values(size.bytes));
            if (photoStrippedSizes.length > 0)
                return photoStrippedSizes[0];
        }
        return null;
    }

    async sendMessage (
        receiverUserId: number,  // 수신자의 user ID
        receiverAccessHash: string,  // 수신자의 access hash
        message: string  // 보낼 메시지
    ) {
        // 메시지 전송
        let result = await this.call('messages.sendMessage', {
            peer: {
                _: 'inputPeerUser',
                user_id: receiverUserId,
                access_hash: receiverAccessHash
            },
            message: message,
            random_id: Math.floor(Math.random() * 1e16)
        });

        return result;
    }

    async uploadMediaByBase64(base64Image: string) {
        const imageData = base64Image;
        if (!imageData) throw new Error('image data not found');

        const imageBuffer = Buffer.from(imageData, 'base64');
        return await this.uploadMedia(imageBuffer);
    }
    async uploadMediaByFile(file: Express.Multer.File) {
        const fileBuffer = file.buffer;
        return await this.uploadMedia(fileBuffer, file.originalname);
    }
    async uploadMedia(fileBuffer: Buffer, fileName: string = 'image.png') {
        // 파일의 고유한 ID와 파트 번호 생성
        let fileId = Math.floor(Math.random() * 1e16);
        let filePart = 0;  // 파일이 큰 경우 여러 파트로 분할하여 업로드
        const partSize = 512 * 1024;  // 512KB
        const parts = this.splitIntoParts(fileBuffer, partSize)

        for(let part of parts) {
            let result = await this.call('upload.saveFilePart', {
                file_id: fileId,
                file_part: filePart,
                bytes: part
            });
            filePart++;

            if (!result) {
                throw new Error('File part upload failed.');
            }
        }
        return {
            _: 'inputFile',
            id: fileId,
            parts: filePart,
            name: fileName,
            md5_checksum: ''  // 필요하다면 MD5 체크섬 추가
        } as TelegramInputFile;
    }

    splitIntoParts(data: Buffer, partSize: number): Buffer[] {
        let parts = [];
        for (let i = 0; i < data.length; i += partSize) {
            parts.push(data.slice(i, i + partSize));
        }
        return parts;
    }

    async sendMedia(
        receiverUserId: number,
        receiverAccessHash: string,
        inputFile: TelegramInputFile,  // 이미지 파일 경로
    ) {
        // 2. 이미지 메시지 전송
        let result = await this.call('messages.sendMedia', {
            peer: {
                _: 'inputPeerUser',
                user_id: receiverUserId,
                access_hash: receiverAccessHash
            },
            media: {
                _: 'inputMediaUploadedPhoto',
                file: inputFile,  // 이전 단계에서 얻은 inputFile 객체
            },
            random_id: Math.floor(Math.random() * 1e16)
        });

        return result;
    }

}

export type TelegramInputFile = {
    _: string,
    id: number,
    parts: number,
    name: string,
    md5_checksum: string
}

export default Telegram;
