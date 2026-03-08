import express from "express";
import cors from "cors";
import whatsappRoutes from "./routes/whatsapp.routes";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`📥 [${new Date().toISOString()}] ${req.method} ${req.path}`);
  if (req.method === 'POST' && req.body) {
    console.log(`📥 [REQUEST] Body keys:`, Object.keys(req.body));
  }
  next();
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    port: process.env.PORT || 3000
  });
});

app.use("/", whatsappRoutes);

export default app;
