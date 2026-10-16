import "dotenv/config";
import express from "express";
import { connectDB } from "./config/db";
import authRoutes from "./routes/authRoutes";
import campaignRoutes from "./routes/campaignRoutes";
import submissionRoutes from "./routes/submissionRoutes";
import cors from "cors";

const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.use(express.json());

app.use(cors({ origin: "http://localhost:3000" }));

app.use("/api/auth", authRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/submissions", submissionRoutes);

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Meme'd Payout Tracker API is running",
  });
});

async function startServer(): Promise<void> {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

void startServer();