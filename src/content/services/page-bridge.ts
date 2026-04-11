export const PAGE_BRIDGE_EVENTS = {
  userInfo: "grouptube:user-info",
  requestUserInfo: "grouptube:request-user-info",
} as const;

export function ensurePageBridgeInjected(): void {
  // Page script is registered as a content_script with world: "MAIN" in the manifest.
}
