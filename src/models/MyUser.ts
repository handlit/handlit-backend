import mongoose, {Document, Schema} from 'mongoose';
import {UserState} from "@unirep/core";
import {BigNumber, ethers} from "ethers";
import {Unirep} from "@unirep/contracts/typechain/contracts/Unirep";

export interface IMyUser extends Document {
  userId: string,
  walletAddress: string,
  phone: string,
  token: string,
  firstName: string,
  lastName: string,
  userName: string,
  accessHash: string,
  telegramId: string,
  telegramPhotoId: string,
  uniRepId: string,
  uniRepEpochKey: bigint,
  uniRepUser: UserState,
  uniRepAttester: ethers.Wallet,
  uniRepAttesterContract: Unirep,
}

export const MyUserSchema: Schema = new Schema({
  userId: { type: String, required: true },
  walletAddress: { type: String },
  phone: { type: String },
  token: { type: String },
  firstName: { type: String },
  lastName: { type: String },
  userName: { type: String },
  accessHash: { type: String },
  telegramId: { type: String },
  telegramPhotoId: { type: String },
  uniRepId: { type: String },
  uniRepEpochKey: { type: String },
  uniRepUser: { type: Object },
  uniRepAttester: { type: Object },
  uniRepAttesterContract: { type: Object },
});

const MyUser = mongoose.model<IMyUser>('My_User', MyUserSchema);
export default MyUser;

export async function isUserExistByTelegramId(telegramId: string) {
  return (await MyUser.exists({telegramId: telegramId})) ?? false
}
export async function getUserByTelegramId(telegramId: string) {
  return await MyUser.findOne({telegramId: telegramId})
}
