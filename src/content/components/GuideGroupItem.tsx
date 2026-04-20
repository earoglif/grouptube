import { ChevronDown } from "lucide-react";
import type { ChannelId, Group, Subscription } from "../types";
import { GuideSubscriptionItem } from "./GuideSubscriptionItem";

type GuideGroupItemLabels = {
  emptyLabel: string;
  expandLabel: string;
  collapseLabel: string;
};

type GuideGroupItemProps = {
  group: Group;
  subscriptions: Subscription[];
  currentPathname: string;
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
  labels: GuideGroupItemLabels;
  newnessMap?: Map<ChannelId, boolean>;
  onChannelSeen?: (channelId: ChannelId) => void;
};

export function GuideGroupItem({
  group,
  subscriptions,
  currentPathname,
  isCollapsed,
  onToggleCollapsed,
  labels,
  newnessMap,
  onChannelSeen,
}: GuideGroupItemProps) {
  return (
    <section className="guide-group">
      <button
        type="button"
        className="guide-group-header"
        onClick={onToggleCollapsed}
        aria-label={isCollapsed ? labels.expandLabel : labels.collapseLabel}
      >
        <ChevronDown
          size={18}
          strokeWidth={2}
          className={`guide-group-chevron${isCollapsed ? " is-collapsed" : ""}`}
          aria-hidden="true"
        />
        <span className="guide-group-color" style={{ backgroundColor: group.color }} aria-hidden="true" />
        <span className="guide-group-name" title={group.name}>
          {group.name}
        </span>
      </button>
      {!isCollapsed ? (
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
            <p className="guide-empty-text">{labels.emptyLabel}</p>
          )}
        </div>
      ) : null}
    </section>
  );
}
