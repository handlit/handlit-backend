import mongoose, {Document, Schema} from 'mongoose';

export interface ICountry extends Document {
  name: string;
  code: string;
  number: string;
}

export const CountrySchema: Schema = new Schema({
  name: { type: String, required: true },
  code: { type: String, required: true },
  number: { type: String, required: true },
});

const Country = mongoose.model<ICountry>('Country', CountrySchema);
export default Country;
