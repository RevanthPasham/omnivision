import "dotenv/config";
import app from "../src/app";

/**
 * Vercel serverless entry: export the Express app directly (no serverless-http).
 * Local dev uses `npm run dev` → src/server.ts with app.listen().
 */
export default app;
