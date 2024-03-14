import mongoose from "mongoose";

const connect = async () => {
  try {
    const MONGO_URI = process.env.MONGO_URI;
    if (!MONGO_URI) {
      throw new Error(
        "Please define the MONGO_URI environment variable inside environment variables"
      );
    }
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected");
  } catch (error) {
    console.log("MongoDB connection failed", error);
  }
};

export default connect;
