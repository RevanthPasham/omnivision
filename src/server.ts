import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import webhookRoutes from "./routes/webhook.routes";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/", webhookRoutes);

app.listen(process.env.PORT, () => {
  console.log("Server running");
});
