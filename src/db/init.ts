import { pool } from "../config/neon";

export const initializeDatabase = async (): Promise<void> => {
  try {
    console.log("Initializing database...");
    
    // Drop old table if it exists with different schema
    await pool.query(`
      DROP TABLE IF EXISTS whatsapp_messages
    `);
    
    // Create whatsapp_messages table with the correct schema
    await pool.query(`
      CREATE TABLE whatsapp_messages (
        id SERIAL PRIMARY KEY,
        wa_message_id VARCHAR(100),
        from_number VARCHAR(30),
        message TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        raw_payload JSONB
      )
    `);

    // Create index on from_number for faster queries
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_from_number 
      ON whatsapp_messages(from_number)
    `);

    // Create index on created_at for faster time-based queries
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_created_at 
      ON whatsapp_messages(created_at)
    `);

    // Create index on wa_message_id for faster lookups
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_wa_message_id 
      ON whatsapp_messages(wa_message_id)
    `);

    console.log("✅ Database tables initialized successfully");
  } catch (err: any) {
    console.error("❌ Database initialization failed:", err.message);
    throw err;
  }
};
