import mongoose, {ConnectOptions} from 'mongoose';

const connectionOptions: ConnectOptions = {
};

mongoose.connect(process.env.MONGODB_URI as string, connectionOptions)
  .then(async () => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => console.error('Failed to connect to MongoDB:', err));
