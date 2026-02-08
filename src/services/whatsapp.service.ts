import { pool } from "../config/neon";

export const handleIncomingMessage = async (payload: any) => {

  const entry = payload.entry?.[0];
  const changes = entry?.changes?.[0];
  const message = changes?.value?.messages?.[0];

  if (!message) {
    return;
  }

  const text = message.text?.body || "";
  const from = message.from;
  const waId = message.id;

  await pool.query(
    `INSERT INTO whatsapp_messages
     (wa_message_id, from_number, message, raw_payload)
     VALUES ($1, $2, $3, $4)`,
    [waId, from, text, payload]
  );
};
