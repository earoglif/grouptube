import type { ISubscription } from "../../shared/types";
import type { SubscriptionSortMode } from "./subscription-sort";

const NAME_COLLATOR = new Intl.Collator(undefined, { sensitivity: "base" });

export function isSubscriptionSortMode(value: string): value is SubscriptionSortMode {
  return value === "relevance" || value === "nameAsc" || value === "nameDesc";
}

export function sortSubscriptions(subscriptions: ISubscription[], sortMode: SubscriptionSortMode): ISubscription[] {
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
