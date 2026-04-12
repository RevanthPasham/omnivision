import { Request, Response } from "express";
import { handleIncomingMessage } from "../services/whatsapp.service";

export const verifyWebhook = (req: Request, res: Response) => {

  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" &&
      token === process.env.VERIFY_TOKEN) {

    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
};

export const receiveWebhook = async (req: Request, res: Response) => {

  try {
    await handleIncomingMessage(req.body);
    res.sendStatus(200);
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
};
