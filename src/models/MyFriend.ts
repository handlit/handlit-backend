import mongoose, {Document, Schema} from 'mongoose';
import * as buffer from "buffer";
const QRCode = require('qrcode');

export interface IMyFriend extends Document {
  userId: string,
  myCardId: string,
  friendId: string,
  friendCardId: string,
  group: string,
  hiMessage: string,
  picture: [string],
  place: string,
  description: string,
  firstName: string,
  lastName: string,
  userName: string,
  accessHash: string,
  telegramId: string,
  telegramPhotoId: string,
  isNewFriendMessage: boolean,
}

export const MyFriendSchema: Schema = new Schema({
  userId: { type: String, required: true },
  myCardId: { type: String },
  friendId: { type: String },
  friendCardId: { type: String },
  group: { type: String },
  hiMessage: { type: String },
  picture: { type: [String] },
  place: { type: String },
  description: { type: String },
  firstName: { type: String },
  lastName: { type: String },
  userName: { type: String },
  accessHash: { type: String },
  telegramId: { type: String },
  telegramPhotoId: { type: String },
  isNewFriendMessage: { type: Boolean, default: false },
});

const MyFriend = mongoose.model<IMyFriend>('My_Friend', MyFriendSchema);
export default MyFriend;

export async function getMyFriend(userId: string) {
  return await MyFriend.find({userId: userId})
}

export async function getMyFriendById(id: string) {
  const card = await MyFriend.findById(id)
  if (!card) {
    throw new Error('MyFriend not found')
  }
  return card
}

export async function createFriend(myFriend: IMyFriend) {
  return await MyFriend.create(myFriend)
}

