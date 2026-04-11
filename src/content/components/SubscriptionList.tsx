import { useDndContext, useDroppable } from "@dnd-kit/core";
import type { Subscription } from "../types";
import { SubscriptionItem } from "./SubscriptionItem";
import { UNGROUPED_DROP_ID } from "./dnd";

type SubscriptionListProps = {
  title: string;
  emptyLabel: string;
  dragSubscriptionLabel: string;
  subscriptions: Subscription[];
};

export function SubscriptionList({ title, emptyLabel, dragSubscriptionLabel, subscriptions }: SubscriptionListProps) {
  const { active } = useDndContext();
  const { setNodeRef, isOver } = useDroppable({
    id: UNGROUPED_DROP_ID,
  });

  const isSubscriptionOver = isOver && active?.data.current?.kind === "subscription";

  return (
    <section ref={setNodeRef} className={`grouptube-ungrouped${isSubscriptionOver ? " is-over" : ""}`}>
      <h3 className="grouptube-ungrouped-title">{title}</h3>
      <div className="grouptube-ungrouped-list">
        {subscriptions.length > 0 ? (
          subscriptions.map((subscription) => (
            <SubscriptionItem
              key={subscription.channelId}
              subscription={subscription}
              groupId={null}
              dragHandleLabel={dragSubscriptionLabel}
            />
          ))
        ) : (
          <p className="grouptube-empty-text">{emptyLabel}</p>
        )}
      </div>
    </section>
  );
}
