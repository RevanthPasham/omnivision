import dotenv from "dotenv";

// Load environment variables first, before any other imports
dotenv.config();

import app from "./app";
import { testConnection } from "./config/neon";
import { initializeDatabase } from "./db/init";

const PORT = process.env.PORT || 3000;

console.log(`\n🌐 ==========================================`);
console.log(`🌐 Server Configuration:`);
console.log(`🌐 Port: ${PORT}`);
console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`🌐 ==========================================\n`);

if (process.env.PORT && parseInt(process.env.PORT) !== 3000) {
  console.log(`⚠️  WARNING: Server is running on port ${PORT}`);
  console.log(`⚠️  Make sure ngrok is pointing to port ${PORT}`);
  console.log(`⚠️  Run: ngrok http ${PORT}\n`);
} else {
  console.log(`📡 Make sure ngrok is pointing to port ${PORT}`);
  console.log(`💡 If using ngrok, run: ngrok http ${PORT}\n`);
}

// Initialize database and start server
const startServer = async () => {
  try {
    // Test database connection
    const connected = await testConnection();
    if (!connected) {
      console.error("⚠️  Server starting but database connection failed. Some features may not work.");
    } else {
      // Initialize database tables
      await initializeDatabase();
    }

    // Start the server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
};

startServer();
