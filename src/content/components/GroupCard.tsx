import { useDndContext } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import type { Group, Subscription } from "../../shared/types";
import { GroupForm, type GroupFormLabels } from "./GroupForm";
import { SubscriptionItem } from "./SubscriptionItem";
import { type GroupDragData, getGroupDragId } from "./dnd";

export type GroupCardLabels = {
  editLabel: string;
  deleteLabel: string;
  expandLabel: string;
  collapseLabel: string;
  emptyLabel: string;
  dragGroupLabel: string;
  dragSubscriptionLabel: string;
};

type GroupCardProps = {
  group: Group;
  subscriptions: Subscription[];
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
  labels: GroupCardLabels;
  formLabels: GroupFormLabels;
  onDelete: (groupId: string) => Promise<void> | void;
  onUpdate: (groupId: string, values: { name: string; color: string }) => Promise<void> | void;
};

export function GroupCard({
  group,
  subscriptions,
  isCollapsed,
  onToggleCollapsed,
  labels,
  formLabels,
  onDelete,
  onUpdate,
}: GroupCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const { active } = useDndContext();

  const { attributes, listeners, setNodeRef, transform, transition, isDragging, isOver } = useSortable({
    id: getGroupDragId(group.id),
    data: {
      kind: "group",
      groupId: group.id,
    } satisfies GroupDragData,
  });

  const isSubscriptionOver = isOver && active?.data.current?.kind === "subscription";

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    borderColor: isSubscriptionOver ? group.color : undefined,
  };

  return (
    <article
      ref={setNodeRef}
      className={`grouptube-group-card${isDragging ? " is-dragging" : ""}${isSubscriptionOver ? " is-over" : ""}`}
      style={style}
    >
      <div className="grouptube-group-header">
        <div className="grouptube-group-title-wrap">
          <button
            type="button"
            className="grouptube-drag-handle"
            aria-label={labels.dragGroupLabel}
            {...attributes}
            {...listeners}
          >
            ≡
          </button>
          <button
            type="button"
            className="grouptube-collapse-toggle"
            onClick={onToggleCollapsed}
            aria-label={isCollapsed ? labels.expandLabel : labels.collapseLabel}
          >
            <ChevronDown
              size={18}
              strokeWidth={2}
              className={`grouptube-collapse-chevron${isCollapsed ? " is-collapsed" : ""}`}
              aria-hidden="true"
            />
          </button>
          <span className="grouptube-group-color" style={{ backgroundColor: group.color }} />
          <h3 className="grouptube-group-title">{group.name}</h3>
        </div>
        <div className="grouptube-inline-actions grouptube-group-header-actions">
          <button
            type="button"
            className="grouptube-icon-button grouptube-group-action-icon"
            onClick={() => setIsEditing((value) => !value)}
            title={labels.editLabel}
            aria-label={labels.editLabel}
          >
            <Pencil size={18} strokeWidth={2} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="grouptube-icon-button grouptube-group-action-icon"
            onClick={() => void onDelete(group.id)}
            title={labels.deleteLabel}
            aria-label={labels.deleteLabel}
          >
            <Trash2 size={18} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>
      </div>

      {isEditing ? (
        <GroupForm
          mode="edit"
          labels={formLabels}
          initialName={group.name}
          initialColor={group.color}
          onCancel={() => setIsEditing(false)}
          onSubmit={async (values) => {
            await onUpdate(group.id, values);
            setIsEditing(false);
          }}
        />
      ) : null}

      {!isCollapsed ? (
        <div className="grouptube-group-content">
          {subscriptions.length > 0 ? (
            subscriptions.map((subscription) => (
              <SubscriptionItem
                key={subscription.channelId}
                subscription={subscription}
                groupId={group.id}
                dragHandleLabel={labels.dragSubscriptionLabel}
              />
            ))
          ) : (
            <p className="grouptube-empty-text">{labels.emptyLabel}</p>
          )}
        </div>
      ) : null}
    </article>
  );
}
