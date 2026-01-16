import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const mode = process.env.DB_MODE || "local";

    const mongoURI =
      mode === "atlas"
        ? process.env.MONGO_URI_ATLAS
        : process.env.MONGO_URI_LOCAL;

    if (!mongoURI) {
      throw new Error("MongoDB URI not provided");
    }

    console.log(`Connecting to MongoDB (${mode}, ${mongoURI})...`);

    await mongoose.connect(mongoURI);

    console.log(`MongoDB connected (${mode})`);
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

export default connectDB;
