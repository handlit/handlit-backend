import mongoose, {Document, Schema} from 'mongoose';
import * as buffer from "buffer";
const QRCode = require('qrcode');

export interface IMyCard extends Document {
  userId: string
  name: string;
  email: string;
  company: string;
  title: string;
  description: string;
  cardImageBase64: string;
  faceImageBase64: string;
  isMinted: boolean;
}

export const MyCardSchema: Schema = new Schema({
  userId: { type: String, required: true },
  name: { type: String },
  email: { type: String },
  company: { type: String },
  title: { type: String },
  description: { type: String },
  cardImageBase64: { type: String },
  faceImageBase64: { type: String },
  isMinted: { type: Boolean, default: false },
});

const MyCard = mongoose.model<IMyCard>('My_Card', MyCardSchema);
export default MyCard;

export async function getMyCard(userId: string) {
  return await MyCard.find({userId: userId})
}

export async function getMyCardById(id: string) {
  const card = await MyCard.findById(id)
  if (!card) {
    throw new Error('MyCard not found')
  }
  return card
}

export async function createCard(myCard: IMyCard) {
  return await MyCard.create(myCard)
}

