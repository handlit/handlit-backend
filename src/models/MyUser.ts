import mongoose, {Document, Schema} from 'mongoose';

export interface IMyUser extends Document {
  userId: string,
  phone: string,
  token: string,
  firstName: string,
  lastName: string,
  userName: string,
}

export const MyUserSchema: Schema = new Schema({
  userId: { type: String, required: true },
  phone: { type: String },
  token: { type: String },
  firstName: { type: String },
  lastName: { type: String },
  userName: { type: String },
});

const MyUser = mongoose.model<IMyUser>('My_User', MyUserSchema);
export default MyUser;

