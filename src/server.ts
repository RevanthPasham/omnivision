import dotenv from "dotenv";

// Load environment variables first, before any other imports
dotenv.config();

import app from "./app";
import { testConnection } from "./config/neon";
import { initializeDatabase } from "./db/init";

const PORT = process.env.PORT || 3000;

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
