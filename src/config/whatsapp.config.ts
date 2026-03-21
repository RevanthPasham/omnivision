export interface WhatsAppConfig {
  token: string;
  phoneId: string;
  verifyToken: string;
  apiVersion: string;
}

export const getWhatsAppConfig = (): WhatsAppConfig => {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  // Provide helpful error messages
  if (!token) {
    throw new Error("WHATSAPP_TOKEN environment variable is required. Check your .env file.");
  }
  if (!phoneId) {
    throw new Error("WHATSAPP_PHONE_ID environment variable is required. Check your .env file.");
  }
  if (!verifyToken) {
    throw new Error("WHATSAPP_VERIFY_TOKEN environment variable is required. Check your .env file.");
  }

  return {
    token,
    phoneId,
    verifyToken,
    apiVersion: "v21.0", // WhatsApp Cloud API version
  };
};

// Safe version that returns null instead of throwing
export const getWhatsAppConfigSafe = (): WhatsAppConfig | null => {
  try {
    return getWhatsAppConfig();
  } catch (error) {
    return null;
  }
};

export const getGraphApiUrl = (phoneId: string, apiVersion: string = "v21.0"): string => {
  return `https://graph.facebook.com/${apiVersion}/${phoneId}/messages`;
};
