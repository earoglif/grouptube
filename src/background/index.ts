import { runtime } from "webextension-polyfill";

function init(): void {
  runtime.onInstalled.addListener(() => {
    console.log("BG loaded");
  });
}

init();
