import { pool } from "../config/neon";

export const handleIncomingMessage = async (body: any) => {

  const change = body?.entry?.[0]?.changes?.[0]?.value;

  if (!change) {
    console.log("No change object");
    return;
  }

  // Ignore delivery/read status events
  if (change.statuses) {
    console.log("Status update — skipping");
    return;
  }

  const msg = change.messages?.[0];

  if (!msg) {
    console.log("No message object");
    return;
  }

  const waMessageId = msg.id ?? null;
  const fromNumber = msg.from ?? null;
  const type = msg.type ?? "unknown";

  let messageText: string | null = null;

  if (type === "text") messageText = msg.text?.body ?? null;
  if (type === "button") messageText = msg.button?.text ?? null;
  if (type === "interactive") messageText = msg.interactive?.button_reply?.title ?? null;

  console.log("Parsed message:", { waMessageId, fromNumber, type, messageText });

  if (!fromNumber || !messageText) {
    console.log("Message empty — not saving");
    return;
  }

  try {
    // Save the entire raw payload as JSONB
    const rawPayload = JSON.stringify(body);

    const result = await pool.query(
      `INSERT INTO whatsapp_messages(wa_message_id, from_number, message, raw_payload)
       VALUES ($1, $2, $3, $4::jsonb)
       RETURNING id`,
      [waMessageId, fromNumber, messageText, rawPayload]
    );

    console.log(`✅ Message saved to DB (ID: ${result.rows[0].id})`);
  } catch (err: any) {
    console.error("❌ DB ERROR:", err.message);
    if (err.code === "42P01") {
      console.error("💡 Table 'whatsapp_messages' does not exist. Run database initialization.");
    } else if (err.code === "ECONNREFUSED") {
      console.error("💡 Cannot connect to database. Check your DATABASE_URL in .env file.");
    }
    // Re-throw to allow caller to handle if needed
    throw err;
  }
};
