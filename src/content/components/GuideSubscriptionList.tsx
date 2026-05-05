import type { ChannelId, ISubscription } from "../../shared/types";
import { GuideSubscriptionItem } from "./GuideSubscriptionItem";

type GuideSubscriptionListProps = {
  title: string;
  currentPathname: string;
  subscriptions: ISubscription[];
  newnessMap?: Map<ChannelId, boolean>;
  onChannelSeen?: (channelId: ChannelId) => void;
};

export function GuideSubscriptionList({
  title,
  currentPathname,
  subscriptions,
  newnessMap,
  onChannelSeen,
}: GuideSubscriptionListProps) {
  if (subscriptions.length === 0) return null;

  return (
    <section className="guide-ungrouped">
      <h3 className="guide-ungrouped-title">{title}</h3>
      <div className="guide-sub-list">
        {subscriptions.map((subscription) => (
          <GuideSubscriptionItem
            key={subscription.channelId}
            subscription={subscription}
            currentPathname={currentPathname}
            hasNewContent={newnessMap?.get(subscription.channelId) ?? false}
            onSeen={onChannelSeen}
          />
        ))}
      </div>
    </section>
  );
}
