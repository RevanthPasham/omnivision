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

  if (!token) {
    throw new Error("WHATSAPP_TOKEN environment variable is required");
  }
  if (!phoneId) {
    throw new Error("WHATSAPP_PHONE_ID environment variable is required");
  }
  if (!verifyToken) {
    throw new Error("WHATSAPP_VERIFY_TOKEN environment variable is required");
  }

  return {
    token,
    phoneId,
    verifyToken,
    apiVersion: "v21.0", // WhatsApp Cloud API version
  };
};

export const getGraphApiUrl = (phoneId: string, apiVersion: string = "v21.0"): string => {
  return `https://graph.facebook.com/${apiVersion}/${phoneId}/messages`;
};
