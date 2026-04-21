import { runtime } from "webextension-polyfill";
import type { Action, MessageMap } from "./actions";

type RequestEnvelope<A extends Action> = {
  action: A;
  payload: MessageMap[A]["req"];
};

type ResponseEnvelope<A extends Action> =
  | { ok: true; data: MessageMap[A]["res"] }
  | { ok: false; error: string };

export async function sendMessage<A extends Action>(
  action: A,
  payload: MessageMap[A]["req"]
): Promise<MessageMap[A]["res"]> {
  const message: RequestEnvelope<A> = { action, payload };
  const response = (await runtime.sendMessage(message)) as ResponseEnvelope<A> | undefined;

  if (!response || typeof response !== "object") {
    throw new Error(`Invalid response for action: ${action}`);
  }
  if (!response.ok) {
    throw new Error(response.error || `Message failed for action: ${action}`);
  }

  return response.data;
}
