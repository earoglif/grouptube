import { runtime } from "webextension-polyfill";
import type { Action, MessageMap } from "./actions";

type RequestEnvelope<A extends Action> = {
  action: A;
  payload: MessageMap[A]["req"];
};

type ResponseEnvelope<A extends Action> =
  | { ok: true; data: MessageMap[A]["res"] }
  | { ok: false; error: string };

type HandlerMap = {
  [A in Action]: (payload: MessageMap[A]["req"]) => Promise<MessageMap[A]["res"]> | MessageMap[A]["res"];
};

function isRequestEnvelope(value: unknown): value is RequestEnvelope<Action> {
  return (
    typeof value === "object" &&
    value !== null &&
    "action" in value &&
    "payload" in value &&
    typeof (value as { action?: unknown }).action === "string"
  );
}

export function registerHandlers(handlers: HandlerMap): void {
  runtime.onMessage.addListener((message: unknown) => {
    if (!isRequestEnvelope(message)) {
      return undefined;
    }

    const action = message.action as Action;
    const handler = handlers[action];
    if (!handler) {
      return undefined;
    }

    return Promise.resolve(handler(message.payload as never))
      .then((data): ResponseEnvelope<Action> => ({ ok: true, data }))
      .catch((error: unknown): ResponseEnvelope<Action> => ({
        ok: false,
        error: error instanceof Error ? error.message : `Action failed: ${action}`,
      }));
  });
}
