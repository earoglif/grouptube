import type { Subscription } from "../types";
import { GuideSubscriptionItem } from "./GuideSubscriptionItem";

type GuideSubscriptionListProps = {
  title: string;
  emptyLabel: string;
  currentPathname: string;
  subscriptions: Subscription[];
};

export function GuideSubscriptionList({ title, emptyLabel, currentPathname, subscriptions }: GuideSubscriptionListProps) {
  return (
    <section className="guide-ungrouped">
      <h3 className="guide-ungrouped-title">{title}</h3>
      <div className="guide-sub-list">
        {subscriptions.length > 0 ? (
          subscriptions.map((subscription) => (
            <GuideSubscriptionItem
              key={subscription.channelId}
              subscription={subscription}
              currentPathname={currentPathname}
            />
          ))
        ) : (
          <p className="guide-empty-text">{emptyLabel}</p>
        )}
      </div>
    </section>
  );
}
