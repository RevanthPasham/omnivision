import express from "express";
import cors from "cors";
import whatsappRoutes from "./routes/whatsapp.routes";

const app = express();

// Instant health checks (before heavy middleware) — use on Vercel without DB
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`📥 [${new Date().toISOString()}] ${req.method} ${req.path}`);
  if (req.method === "POST" && req.body) {
    console.log(`📥 [REQUEST] Body keys:`, Object.keys(req.body));
  }
  next();
});

app.use("/", whatsappRoutes);

export default app;
