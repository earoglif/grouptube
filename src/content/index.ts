import { initGuideGroups } from "./guide-groups";
import { ensurePageBridgeInjected } from "./services/page-bridge";
import { initSubscribeAssign } from "./subscribe-assign";

function init(): void {
  ensurePageBridgeInjected();
  initGuideGroups();
  initSubscribeAssign();
}

init();
