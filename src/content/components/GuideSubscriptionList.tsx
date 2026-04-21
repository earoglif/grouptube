import type { ChannelId, Subscription } from "../../shared/types";
import { GuideSubscriptionItem } from "./GuideSubscriptionItem";

type GuideSubscriptionListProps = {
  title: string;
  emptyLabel: string;
  currentPathname: string;
  subscriptions: Subscription[];
  newnessMap?: Map<ChannelId, boolean>;
  onChannelSeen?: (channelId: ChannelId) => void;
};

export function GuideSubscriptionList({
  title,
  emptyLabel,
  currentPathname,
  subscriptions,
  newnessMap,
  onChannelSeen,
}: GuideSubscriptionListProps) {
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
              hasNewContent={newnessMap?.get(subscription.channelId) ?? false}
              onSeen={onChannelSeen}
            />
          ))
        ) : (
          <p className="guide-empty-text">{emptyLabel}</p>
        )}
      </div>
    </section>
  );
}
