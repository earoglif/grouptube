import type { Subscription } from "../types";
import type { SubscriptionSortMode } from "./subscription-sort";

const NAME_COLLATOR = new Intl.Collator(undefined, { sensitivity: "base" });

export function isSubscriptionSortMode(value: string): value is SubscriptionSortMode {
  return value === "relevance" || value === "nameAsc" || value === "nameDesc";
}

export function sortSubscriptions(subscriptions: Subscription[], sortMode: SubscriptionSortMode): Subscription[] {
  if (sortMode === "relevance") {
    return subscriptions;
  }

  const sorted = [...subscriptions];
  sorted.sort((left, right) =>
    sortMode === "nameAsc"
      ? NAME_COLLATOR.compare(left.name, right.name)
      : NAME_COLLATOR.compare(right.name, left.name)
  );
  return sorted;
}
