import { Request, Response } from "express";
import { handleIncomingMessage } from "../services/whatsapp.service";
import { getWhatsAppConfig } from "../config/whatsapp.config";

export const verifyWebhook = (req: Request, res: Response) => {
  try {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    const config = getWhatsAppConfig();

    if (mode === "subscribe" && token === config.verifyToken) {
      console.log("✅ Webhook verified successfully");
      return res.status(200).send(challenge);
    }

    console.log("❌ Webhook verification failed");
    return res.sendStatus(403);
  } catch (error: any) {
    console.error("❌ Webhook verification error:", error.message);
    return res.sendStatus(500);
  }
};

export const receiveWebhook = async (req: Request, res: Response) => {
  try {
    // Respond immediately to WhatsApp (within 20 seconds)
    res.sendStatus(200);

    // Process message asynchronously
    handleIncomingMessage(req.body).catch((err) => {
      console.error("❌ Error processing webhook:", err);
    });
  } catch (err: any) {
    console.error("❌ Webhook receive error:", err.message);
    // Already sent 200, so we can't change response
  }
};
