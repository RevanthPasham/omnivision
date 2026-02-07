import { Request, Response } from "express";
import { saveMessage } from "../services/whatsapp.service";

export const verifyWebhook = (req: Request, res: Response) => {

  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
};

export const receiveMessage = async (req: Request, res: Response) => {

  try {
    await saveMessage(req.body);
    res.sendStatus(200);
  } catch (err) {
    res.sendStatus(500);
  }
};
