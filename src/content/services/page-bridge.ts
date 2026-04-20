export const PAGE_BRIDGE_EVENTS = {
  userInfo: "grouptube:user-info",
  requestUserInfo: "grouptube:request-user-info",
  subscriptionSubscribe: "grouptube:subscription-subscribe",
  subscriptionUnsubscribe: "grouptube:subscription-unsubscribe",
} as const;

export function ensurePageBridgeInjected(): void {
  // Page script is registered as a content_script with world: "MAIN" in the manifest.
}
