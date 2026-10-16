import mongoose from "mongoose";

export async function connectDB(): Promise<void> {
  const {
    MONGODB_USERNAME,
    MONGODB_PASSWORD,
    MONGODB_CLUSTER,
    MONGODB_DATABASE,
  } = process.env;

  if (
    !MONGODB_USERNAME ||
    !MONGODB_PASSWORD ||
    !MONGODB_CLUSTER ||
    !MONGODB_DATABASE
  ) {
    throw new Error("Missing MongoDB environment variables");
  }

  const username = encodeURIComponent(MONGODB_USERNAME);
  const password = encodeURIComponent(MONGODB_PASSWORD);
  const database = encodeURIComponent(MONGODB_DATABASE);

  const mongoUri =
    `mongodb+srv://${username}:${password}@${MONGODB_CLUSTER}/${database}?retryWrites=true&w=majority`;

  await mongoose.connect(mongoUri);
  console.log("MongoDB connected successfully");
}