import axios from "axios";
import FormData from "form-data";
import { pool } from "../config/neon";
import { ensureSchemaOnce } from "../db/ensureSchema";
import { getWhatsAppConfig, getGraphApiUrl } from "../config/whatsapp.config";
import { parseMessage, validateCommand } from "../utils/messageParser";
import * as productService from "./product.service";
import * as reportService from "./report.service";

export async function sendWhatsAppMessage(to: string, message: string): Promise<void> {
  const config = getWhatsAppConfig();
  const url = getGraphApiUrl(config.phoneId, config.apiVersion);

  await axios.post(
    url,
    {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: { preview_url: false, body: message },
    },
    {
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
      },
    }
  );
}

async function uploadMediaToWhatsApp(
  buffer: Buffer,
  filename: string,
  token: string,
  phoneId: string,
  apiVersion: string
): Promise<string> {
  const url = `https://graph.facebook.com/${apiVersion}/${phoneId}/media`;
  const form = new FormData();
  form.append("messaging_product", "whatsapp");
  form.append("type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  form.append("file", buffer, {
    filename,
    contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const response = await axios.post(url, form, {
    headers: {
      Authorization: `Bearer ${token}`,
      ...form.getHeaders(),
    },
    maxBodyLength: Infinity,
  });

  const mediaId = response.data?.id;
  if (!mediaId) throw new Error("Media upload failed: no media id returned");
  return mediaId;
}

export async function sendWhatsAppDocument(
  to: string,
  documentBuffer: Buffer,
  filename: string,
  caption: string
): Promise<void> {
  const config = getWhatsAppConfig();
  const mediaId = await uploadMediaToWhatsApp(
    documentBuffer,
    filename,
    config.token,
    config.phoneId,
    config.apiVersion
  );

  const url = getGraphApiUrl(config.phoneId, config.apiVersion);
  await axios.post(
    url,
    {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "document",
      document: {
        id: mediaId,
        filename,
        caption,
      },
    },
    {
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
      },
    }
  );
}

export async function handleIncomingMessage(body: any) {
  const change = body?.entry?.[0]?.changes?.[0]?.value;
  if (!change || change.statuses) return;

  const msg = change.messages?.[0];
  if (!msg) return;

  const waMessageId = msg.id ?? null;
  const fromNumber = msg.from ?? null;
  const type = msg.type ?? "unknown";

  let messageText: string | null = null;
  if (type === "text") messageText = msg.text?.body ?? null;
  if (type === "button") messageText = msg.button?.text ?? null;
  if (type === "interactive") messageText = msg.interactive?.button_reply?.title ?? null;
  if (!fromNumber || !messageText) return;

  try {
    await ensureSchemaOnce();

    const rawPayload = JSON.stringify(body);
    await pool.query(
      `INSERT INTO whatsapp_messages(wa_message_id, from_number, message, raw_payload)
       VALUES ($1, $2, $3, $4::jsonb)
       ON CONFLICT (wa_message_id) DO NOTHING`,
      [waMessageId, fromNumber, messageText, rawPayload]
    );

    const parsed = parseMessage(messageText);
    if (!parsed) {
      await sendWhatsAppMessage(
        fromNumber,
        "❌ Invalid message format.\nUse command + key=value lines.\nExample:\nadd_product\ntitle=Name\nslug=slug\nprice=100\nstock=10"
      );
      return;
    }

    const validation = validateCommand(parsed);
    if (!validation.valid) {
      await sendWhatsAppMessage(fromNumber, `❌ Invalid message: ${validation.error}`);
      return;
    }

    await executeCommand(parsed, fromNumber);
  } catch (err: any) {
    console.error("❌ [MESSAGE] Error processing:", err.message);
    try {
      await sendWhatsAppMessage(fromNumber, `❌ Error: ${err.message}`);
    } catch {
      // noop
    }
  }
}

async function executeCommand(parsed: { command: string; params: Record<string, string> }, from: string) {
  const { command, params } = parsed;
  switch (command) {
    case "add_product":
      await handleAddProduct(params, from);
      return;
    case "update_product":
      await handleUpdateProduct(params, from);
      return;
    case "delete_product":
      await handleDeleteProduct(params, from);
      return;
    case "report_top_products":
      await handleReportTopProducts(from);
      return;
    case "report_low_products":
    case "report_less_products":
      await handleReportLessProducts(from);
      return;
    case "export_sales_excel":
      await handleExportSalesExcel(from);
      return;
    default:
      await sendWhatsAppMessage(from, `❌ Unknown command: ${command}`);
  }
}

async function handleAddProduct(params: Record<string, string>, from: string) {
  const product = await productService.addProduct({
    title: params.title,
    slug: params.slug,
    brand: params.brand,
    material: params.material,
    price: Number(params.price),
    stock: Number(params.stock),
    imageUrl: params.image_url || params.imageurl || params.image,
  });
  await sendWhatsAppMessage(
    from,
    `✅ Product added\nTitle: ${product.title}\nSlug: ${product.slug}\nPrice: ₹${product.price.toFixed(
      2
    )}\nStock: ${product.stock}`
  );
}

async function handleUpdateProduct(params: Record<string, string>, from: string) {
  const updated = await productService.updateProduct({
    slug: params.slug,
    price: params.price ? Number(params.price) : undefined,
    stock: params.stock ? Number(params.stock) : undefined,
    imageUrl: params.image_url || params.imageurl || params.image,
  });
  if (!updated) {
    await sendWhatsAppMessage(from, `❌ Product not found: ${params.slug}`);
    return;
  }
  await sendWhatsAppMessage(
    from,
    `✅ Product updated\nTitle: ${updated.title}\nSlug: ${updated.slug}\nPrice: ₹${updated.price.toFixed(
      2
    )}\nStock: ${updated.stock}`
  );
}

async function handleDeleteProduct(params: Record<string, string>, from: string) {
  const ok = await productService.deleteProduct(params.slug);
  await sendWhatsAppMessage(from, ok ? `✅ Deleted: ${params.slug}` : `❌ Product not found: ${params.slug}`);
}

async function handleReportTopProducts(from: string) {
  const excel = await reportService.generateTopSellingExcel(10);
  const filename = `top-selling-${new Date().toISOString().slice(0, 10)}.xlsx`;
  await sendWhatsAppDocument(from, excel, filename, "Top Selling Products Report");
}

async function handleReportLessProducts(from: string) {
  const excel = await reportService.generateLessSellingExcel(10);
  const filename = `less-selling-${new Date().toISOString().slice(0, 10)}.xlsx`;
  await sendWhatsAppDocument(from, excel, filename, "Less Selling Products Report");
}

async function handleExportSalesExcel(from: string) {
  const buffer = await reportService.generateSalesExcel();
  const filename = `sales-report-${new Date().toISOString().slice(0, 10)}.xlsx`;
  await sendWhatsAppDocument(from, buffer, filename, "Sales Report");
  await sendWhatsAppMessage(from, "✅ Sales report sent.");
}
