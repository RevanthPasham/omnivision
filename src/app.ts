import express from "express";
import cors from "cors";
import whatsappRoutes from "./routes/whatsapp.routes";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/", whatsappRoutes);

export default app;
