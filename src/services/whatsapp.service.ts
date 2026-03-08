import axios from "axios";
import { pool } from "../config/neon";
import { getWhatsAppConfig, getGraphApiUrl } from "../config/whatsapp.config";
import { parseMessage, validateCommand } from "../utils/messageParser";
import * as productService from "./product.service";
import * as reportService from "./report.service";

/**
 * Send WhatsApp message via Meta Graph API
 */
export async function sendWhatsAppMessage(to: string, message: string): Promise<void> {
  try {
    const config = getWhatsAppConfig();
    const url = getGraphApiUrl(config.phoneId, config.apiVersion);

    const response = await axios.post(
      url,
      {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: to,
        type: "text",
        text: {
          preview_url: false,
          body: message,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${config.token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log(`✅ Message sent to ${to}:`, response.data);
  } catch (error: any) {
    console.error(`❌ Failed to send message to ${to}:`, error.response?.data || error.message);
    throw error;
  }
}

/**
 * Send WhatsApp document (Excel file) via Meta Graph API
 */
export async function sendWhatsAppDocument(
  to: string,
  documentBuffer: Buffer,
  filename: string,
  caption?: string
): Promise<void> {
  try {
    const config = getWhatsAppConfig();

    // First, upload media to get media ID
    // Note: For production, you may need to upload to a public URL first
    // This is a simplified version - you might need to use Media API
    const mediaUrl = await uploadMediaToWhatsApp(documentBuffer, filename, config.token);

    const url = getGraphApiUrl(config.phoneId, config.apiVersion);

    const response = await axios.post(
      url,
      {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: to,
        type: "document",
        document: {
          link: mediaUrl,
          filename: filename,
          caption: caption || "Sales Report",
        },
      },
      {
        headers: {
          Authorization: `Bearer ${config.token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log(`✅ Document sent to ${to}:`, response.data);
  } catch (error: any) {
    console.error(`❌ Failed to send document to ${to}:`, error.response?.data || error.message);
    // Fallback: send message with error
    await sendWhatsAppMessage(
      to,
      `⚠️ Unable to send Excel file. Error: ${error.message}\n\nPlease try again later or contact support.`
    );
  }
}

/**
 * Upload media to WhatsApp (simplified - you may need to implement proper media upload)
 * For now, this is a placeholder. In production, you'd need to:
 * 1. Upload file to a public URL (e.g., S3, Cloudinary)
 * 2. Use that URL with WhatsApp Media API
 */
async function uploadMediaToWhatsApp(buffer: Buffer, filename: string, token: string): Promise<string> {
  // This is a placeholder - in production, upload to a public storage first
  // For now, we'll return an error message
  throw new Error(
    "Media upload not implemented. Please configure a public file storage (S3, Cloudinary, etc.) and implement media upload."
  );
}

/**
 * Handle incoming WhatsApp message and execute commands
 */
export async function handleIncomingMessage(body: any): Promise<void> {
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
    console.log("Message empty — not processing");
    return;
  }

  try {
    // Save the entire raw payload as JSONB
    const rawPayload = JSON.stringify(body);

    await pool.query(
      `INSERT INTO whatsapp_messages(wa_message_id, from_number, message, raw_payload)
       VALUES ($1, $2, $3, $4::jsonb)
       ON CONFLICT DO NOTHING`,
      [waMessageId, fromNumber, messageText, rawPayload]
    );

    console.log(`✅ Message saved to DB`);

    // Parse and process command
    const parsed = parseMessage(messageText);
    if (!parsed) {
      await sendWhatsAppMessage(
        fromNumber,
        "❌ Invalid command format.\n\nAvailable commands:\n• add_product\n• update_product\n• delete_product\n• report_top_products\n• report_low_products\n• export_sales_excel"
      );
      return;
    }

    // Validate command
    const validation = validateCommand(parsed);
    if (!validation.valid) {
      await sendWhatsAppMessage(fromNumber, `❌ ${validation.error}`);
      return;
    }

    // Execute command
    await executeCommand(parsed, fromNumber);
  } catch (err: any) {
    console.error("❌ Error processing message:", err.message);
    try {
      await sendWhatsAppMessage(
        fromNumber,
        `❌ Error processing your request: ${err.message}\n\nPlease check your command format and try again.`
      );
    } catch (sendError) {
      console.error("❌ Failed to send error message:", sendError);
    }
  }
}

/**
 * Execute parsed command
 */
async function executeCommand(parsed: { command: string; params: Record<string, string> }, fromNumber: string): Promise<void> {
  const { command, params } = parsed;

  try {
    switch (command) {
      case "add_product":
        await handleAddProduct(params, fromNumber);
        break;

      case "update_product":
        await handleUpdateProduct(params, fromNumber);
        break;

      case "delete_product":
        await handleDeleteProduct(params, fromNumber);
        break;

      case "report_top_products":
        await handleReportTopProducts(fromNumber);
        break;

      case "report_low_products":
        await handleReportLowProducts(fromNumber);
        break;

      case "export_sales_excel":
        await handleExportSalesExcel(fromNumber);
        break;

      default:
        await sendWhatsAppMessage(fromNumber, `❌ Unknown command: ${command}`);
    }
  } catch (error: any) {
    console.error(`Error executing command ${command}:`, error);
    await sendWhatsAppMessage(fromNumber, `❌ Error: ${error.message}`);
  }
}

/**
 * Handle add_product command
 */
async function handleAddProduct(params: Record<string, string>, fromNumber: string): Promise<void> {
  const product = await productService.addProduct({
    title: params.title,
    slug: params.slug,
    brand: params.brand,
    material: params.material,
    price: parseFloat(params.price),
    stock: parseInt(params.stock, 10),
  });

  const message = `✅ *Product Added Successfully*\n\n` +
    `Title: ${product.title}\n` +
    `Slug: ${product.slug}\n` +
    `Brand: ${product.brand || "N/A"}\n` +
    `Material: ${product.material || "N/A"}\n` +
    `Price: ₹${product.price.toFixed(2)}\n` +
    `Stock: ${product.stock}`;

  await sendWhatsAppMessage(fromNumber, message);
}

/**
 * Handle update_product command
 */
async function handleUpdateProduct(params: Record<string, string>, fromNumber: string): Promise<void> {
  const updateParams: productService.UpdateProductParams = {
    slug: params.slug,
  };

  if (params.price) {
    updateParams.price = parseFloat(params.price);
  }
  if (params.stock) {
    updateParams.stock = parseInt(params.stock, 10);
  }

  const product = await productService.updateProduct(updateParams);

  if (!product) {
    await sendWhatsAppMessage(fromNumber, `❌ Product with slug "${params.slug}" not found.`);
    return;
  }

  const message = `✅ *Product Updated Successfully*\n\n` +
    `Title: ${product.title}\n` +
    `Slug: ${product.slug}\n` +
    `Price: ₹${product.price.toFixed(2)}\n` +
    `Stock: ${product.stock}`;

  await sendWhatsAppMessage(fromNumber, message);
}

/**
 * Handle delete_product command
 */
async function handleDeleteProduct(params: Record<string, string>, fromNumber: string): Promise<void> {
  const deleted = await productService.deleteProduct(params.slug);

  if (!deleted) {
    await sendWhatsAppMessage(fromNumber, `❌ Product with slug "${params.slug}" not found.`);
    return;
  }

  await sendWhatsAppMessage(fromNumber, `✅ Product with slug "${params.slug}" deleted successfully.`);
}

/**
 * Handle report_top_products command
 */
async function handleReportTopProducts(fromNumber: string): Promise<void> {
  const products = await reportService.getTopProducts(10);
  const message = reportService.formatTopProducts(products);
  await sendWhatsAppMessage(fromNumber, message);
}

/**
 * Handle report_low_products command
 */
async function handleReportLowProducts(fromNumber: string): Promise<void> {
  const products = await reportService.getLowStockProducts(10);
  const message = reportService.formatLowStockProducts(products);
  await sendWhatsAppMessage(fromNumber, message);
}

/**
 * Handle export_sales_excel command
 */
async function handleExportSalesExcel(fromNumber: string): Promise<void> {
  try {
    await sendWhatsAppMessage(fromNumber, "📊 Generating sales report... Please wait.");

    const buffer = await reportService.generateSalesExcel();
    const filename = `sales-report-${new Date().toISOString().split("T")[0]}.xlsx`;

    // For now, send a message with instructions since document upload needs proper setup
    // In production, implement proper media upload
    await sendWhatsAppMessage(
      fromNumber,
      `✅ Sales report generated successfully!\n\n` +
        `File: ${filename}\n` +
        `Size: ${(buffer.length / 1024).toFixed(2)} KB\n\n` +
        `⚠️ Note: Document upload requires media storage configuration. ` +
        `Please contact administrator to set up document delivery.`
    );

    // TODO: Implement proper document upload when media storage is configured
    // await sendWhatsAppDocument(fromNumber, buffer, filename, "Sales Report");
  } catch (error: any) {
    console.error("Error generating Excel:", error);
    await sendWhatsAppMessage(fromNumber, `❌ Error generating report: ${error.message}`);
  }
}
