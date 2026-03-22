import { pool } from "../config/neon";

/** Idempotent — safe for repeated runs (Vercel cold starts, local restarts). Never drops data. */
export const initializeDatabase = async (): Promise<void> => {
  try {
    console.log("Ensuring database schema...");

    await pool.query(`
      CREATE TABLE IF NOT EXISTS whatsapp_messages (
        id SERIAL PRIMARY KEY,
        wa_message_id VARCHAR(100),
        from_number VARCHAR(30),
        message TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        raw_payload JSONB
      )
    `);

    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_whatsapp_messages_wa_message_id_unique
      ON whatsapp_messages (wa_message_id)
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_from_number 
      ON whatsapp_messages(from_number)
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_created_at 
      ON whatsapp_messages(created_at)
    `);

    console.log("✅ Database schema ready");
  } catch (err: any) {
    console.error("❌ Database initialization failed:", err.message);
    throw err;
  }
};
