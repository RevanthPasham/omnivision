import { Request, Response } from "express";
import { handleIncomingMessage } from "../services/whatsapp.service";
import { getWhatsAppConfig } from "../config/whatsapp.config";

export const verifyWebhook = (req: Request, res: Response) => {
  try {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    console.log("🔐 [VERIFY] Webhook verification attempt");
    console.log("🔐 [VERIFY] Mode:", mode);
    console.log("🔐 [VERIFY] Token provided:", !!token);

    // Safely get config - don't throw if missing
    let config;
    try {
      config = getWhatsAppConfig();
    } catch (configError: any) {
      console.error("❌ [VERIFY] Config error:", configError.message);
      return res.status(500).json({ 
        error: "Server configuration error",
        message: configError.message 
      });
    }

    if (mode === "subscribe" && token === config.verifyToken) {
      console.log("✅ [VERIFY] Webhook verified successfully");
      return res.status(200).send(challenge);
    }

    console.log("❌ [VERIFY] Webhook verification failed");
    console.log("❌ [VERIFY] Expected token:", config.verifyToken);
    console.log("❌ [VERIFY] Received token:", token);
    return res.sendStatus(403);
  } catch (error: any) {
    console.error("❌ [VERIFY] Webhook verification error:", error.message);
    console.error("❌ [VERIFY] Stack:", error.stack);
    return res.status(500).json({ 
      error: "Internal server error",
      message: error.message 
    });
  }
};

export const receiveWebhook = async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  // CRITICAL: Always respond to WhatsApp within 20 seconds
  // Send response FIRST, then process asynchronously
  
  try {
    console.log("\n📥 ==========================================");
    console.log("📥 [WEBHOOK] Received webhook request");
    console.log("📥 [WEBHOOK] Time:", new Date().toISOString());
    console.log("📥 [WEBHOOK] Method:", req.method);
    console.log("📥 [WEBHOOK] Path:", req.path);
    console.log("📥 [WEBHOOK] Headers:", JSON.stringify(req.headers, null, 2));
    
    // Log body structure (not full body to avoid spam)
    if (req.body) {
      console.log("📥 [WEBHOOK] Body structure:", {
        hasEntry: !!req.body.entry,
        entryLength: req.body.entry?.length || 0
      });
      
      // Log message details if present
      const msg = req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
      if (msg) {
        console.log("📥 [WEBHOOK] Message details:", {
          id: msg.id,
          from: msg.from,
          type: msg.type,
          hasText: !!msg.text?.body
        });
      }
    } else {
      console.log("⚠️ [WEBHOOK] No body in request");
    }

    // CRITICAL: Respond immediately to WhatsApp (within 20 seconds)
    // This prevents 502 errors
    res.status(200).json({ 
      status: "ok", 
      received: true,
      timestamp: new Date().toISOString()
    });
    console.log("✅ [WEBHOOK] Response sent (200 OK) - WhatsApp notified");

    // Process message asynchronously (don't wait for it)
    // This prevents timeouts
    setImmediate(() => {
      handleIncomingMessage(req.body)
        .then(() => {
          const duration = Date.now() - startTime;
          console.log(`✅ [WEBHOOK] Message processed successfully (${duration}ms)`);
          console.log("📥 ==========================================\n");
        })
        .catch((err: any) => {
          const duration = Date.now() - startTime;
          console.error(`❌ [WEBHOOK] Error processing webhook (${duration}ms):`, err.message);
          console.error("❌ [WEBHOOK] Error stack:", err.stack);
          console.log("📥 ==========================================\n");
        });
    });
    
  } catch (err: any) {
    const duration = Date.now() - startTime;
    console.error(`❌ [WEBHOOK] Fatal error in receiveWebhook (${duration}ms):`, err.message);
    console.error("❌ [WEBHOOK] Error stack:", err.stack);
    console.log("📥 ==========================================\n");
    
    // CRITICAL: Always send a response, even on error
    // This prevents 502 Bad Gateway
    if (!res.headersSent) {
      try {
        res.status(200).json({ 
          status: "error", 
          message: "Request received but processing failed",
          error: err.message 
        });
      } catch (responseError) {
        console.error("❌ [WEBHOOK] Failed to send error response:", responseError);
      }
    }
  }
};
