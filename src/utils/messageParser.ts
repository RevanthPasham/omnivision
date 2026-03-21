export interface ParsedCommand {
  command: string;
  params: Record<string, string>;
}

/**
 * Parse WhatsApp message into command and parameters
 * 
 * Expected formats:
 * - add_product\ntitle=value\nslug=value\n...
 * - update_product\nslug=value\nprice=value
 * - delete_product\nslug=value
 * - report_top_products
 * - report_low_products / report_less_products
 * - export_sales_excel
 */
export function parseMessage(message: string): ParsedCommand | null {
  if (!message || typeof message !== "string") {
    return null;
  }

  const lines = message.trim().split(/\r?\n/).map((line) => line.trim()).filter((line) => line.length > 0);

  if (lines.length === 0) {
    return null;
  }

  const command = lines[0].toLowerCase();
  const params: Record<string, string> = {};

  // Parse parameters from remaining lines (key=value format)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const equalIndex = line.indexOf("=");
    if (equalIndex > 0) {
      const key = line.substring(0, equalIndex).trim();
      const value = line.substring(equalIndex + 1).trim();
      if (key && value) {
        params[key.toLowerCase()] = value;
      }
    }
  }

  return { command, params };
}

/**
 * Validate parsed command has required parameters
 */
export function validateCommand(parsed: ParsedCommand): { valid: boolean; error?: string } {
  const { command, params } = parsed;

  switch (command) {
    case "add_product":
      if (!params.title) return { valid: false, error: "Missing required parameter: title" };
      if (!params.slug) return { valid: false, error: "Missing required parameter: slug" };
      if (!params.price) return { valid: false, error: "Missing required parameter: price" };
      if (!params.stock) return { valid: false, error: "Missing required parameter: stock" };
      break;

    case "update_product":
      if (!params.slug) return { valid: false, error: "Missing required parameter: slug" };
      if (!params.price && !params.stock && !params.image_url) {
        return { valid: false, error: "At least one of price, stock, or image_url must be provided" };
      }
      break;

    case "delete_product":
      if (!params.slug) return { valid: false, error: "Missing required parameter: slug" };
      break;

    case "report_top_products":
    case "report_low_products":
    case "report_less_products":
    case "export_sales_excel":
      // No parameters required
      break;

    default:
      return { valid: false, error: `Unknown command: ${command}` };
  }

  return { valid: true };
}
