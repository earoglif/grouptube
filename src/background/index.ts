import { runtime } from "webextension-polyfill";
import type { Subscription } from "../content/types";
import { fetchUserSubscriptions } from "./youtube-api";

type GetSubscriptionsMessage = {
  action: "get-subscriptions";
};

export type GetSubscriptionsResponse =
  | {
      ok: true;
      subscriptions: Subscription[];
    }
  | {
      ok: false;
      error: string;
    };

function isGetSubscriptionsMessage(message: unknown): message is GetSubscriptionsMessage {
  return (
    typeof message === "object" &&
    message !== null &&
    "action" in message &&
    (message as { action?: unknown }).action === "get-subscriptions"
  );
}

async function handleGetSubscriptions(): Promise<GetSubscriptionsResponse> {
  try {
    const subscriptions = await fetchUserSubscriptions();
    return {
      ok: true,
      subscriptions,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load subscriptions";
    return {
      ok: false,
      error: message,
    };
  }
}

function init(): void {
  runtime.onInstalled.addListener(() => {
    console.log("BG loaded");
  });

  runtime.onMessage.addListener((message: unknown) => {
    if (!isGetSubscriptionsMessage(message)) {
      return undefined;
    }

    return handleGetSubscriptions();
  });
}

init();
