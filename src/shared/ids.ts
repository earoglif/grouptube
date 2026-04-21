import type { GroupId } from "./types";

export function createGroupId(): GroupId {
  if (typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `group-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
