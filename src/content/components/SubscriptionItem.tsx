import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { GroupId, Subscription } from "../../shared/types";
import { type SubscriptionDragData, getSubscriptionDragId } from "./dnd";

type SubscriptionItemProps = {
  subscription: Subscription;
  groupId: GroupId | null;
  dragHandleLabel: string;
};

export function SubscriptionItem({ subscription, groupId, dragHandleLabel }: SubscriptionItemProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: getSubscriptionDragId(subscription.channelId),
    data: {
      kind: "subscription",
      channelId: subscription.channelId,
      groupId,
    } satisfies SubscriptionDragData,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  return (
    <div ref={setNodeRef} className={`grouptube-subscription-item${isDragging ? " is-dragging" : ""}`} style={style}>
      <button type="button" className="grouptube-drag-handle" aria-label={dragHandleLabel} {...attributes} {...listeners}>
        ≡
      </button>
      <span className="grouptube-subscription-avatar-wrap" aria-hidden="true">
        {subscription.thumbnailUrl ? (
          <img
            className="grouptube-subscription-avatar"
            src={subscription.thumbnailUrl}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="grouptube-subscription-avatar-fallback" />
        )}
      </span>
      <span className="grouptube-subscription-name">{subscription.name}</span>
    </div>
  );
}
