import { runtime } from "webextension-polyfill";
import { registerHandlers } from "../shared/messaging/server";
import { handleGetChannelDetails } from "./handlers/get-channel-details";
import { handleGetChannelNewness } from "./handlers/get-channel-newness";
import { handleGetSubscriptions } from "./handlers/get-subscriptions";
import { handleMarkChannelSeen } from "./handlers/mark-channel-seen";

function init(): void {
  runtime.onInstalled.addListener(() => {
    console.log("BG loaded");
  });

  registerHandlers({
    "get-subscriptions": handleGetSubscriptions,
    "get-channel-newness": handleGetChannelNewness,
    "mark-channel-seen": handleMarkChannelSeen,
    "get-channel-details": handleGetChannelDetails,
  });
}

init();
