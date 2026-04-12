import { DndContext, PointerSensor, closestCenter, type DragEndEvent, type Modifier, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { useMemo, useState } from "react";
import { useGroups } from "../hooks/useGroups";
import { useSubscriptions } from "../hooks/useSubscriptions";
import type { Subscription } from "../types";
import { GroupForm } from "./GroupForm";
import { GroupList } from "./GroupList";
import { SubscriptionList } from "./SubscriptionList";
import { UNGROUPED_DROP_ID, parseGroupId, parseSubscriptionChannelId } from "./dnd";

export type ModalBodyLabels = {
  newGroupLabel: string;
  refreshLabel: string;
  loadingLabel: string;
  noGroupsLabel: string;
  ungroupedTitle: string;
  ungroupedEmptyLabel: string;
  groupEmptyLabel: string;
  groupEditLabel: string;
  groupDeleteLabel: string;
  groupExpandLabel: string;
  groupCollapseLabel: string;
  groupDragHandleLabel: string;
  subscriptionDragHandleLabel: string;
  createNamePlaceholder: string;
  createLabel: string;
  saveLabel: string;
  cancelLabel: string;
  deleteGroupConfirm: string;
};

type ModalBodyProps = {
  labels: ModalBodyLabels;
};

const restrictToVerticalAxis: Modifier = ({ transform }) => ({
  ...transform,
  x: 0,
});

function resolveDropTargetGroupId(
  overId: unknown,
  overData: { kind?: string; groupId?: string | null } | undefined
): string | null | undefined {
  if (overId === UNGROUPED_DROP_ID) return null;

  const parsedGroupId = parseGroupId(overId);
  if (parsedGroupId) return parsedGroupId;

  if (overData?.kind === "group" && overData.groupId) return overData.groupId;
  if (overData?.kind === "subscription") return overData.groupId ?? null;

  return undefined;
}

export function ModalBody({ labels }: ModalBodyProps) {
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const { subscriptions, isLoading: isSubscriptionsLoading, refresh } = useSubscriptions();
  const {
    groups,
    isLoading: isGroupsLoading,
    channelToGroupMap,
    createGroup,
    updateGroup,
    deleteGroup,
    reorderGroups,
    assignChannelToGroup,
  } = useGroups();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  const { subscriptionsByGroupId, ungroupedSubscriptions } = useMemo(() => {
    const grouped = new Map<string, Subscription[]>();
    for (const group of groups) {
      grouped.set(group.id, []);
    }

    const ungrouped: Subscription[] = [];
    for (const subscription of subscriptions) {
      const groupId = channelToGroupMap.get(subscription.channelId);
      if (groupId && grouped.has(groupId)) {
        grouped.get(groupId)?.push(subscription);
      } else {
        ungrouped.push(subscription);
      }
    }

    return {
      subscriptionsByGroupId: grouped,
      ungroupedSubscriptions: ungrouped,
    };
  }, [channelToGroupMap, groups, subscriptions]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeData = active.data.current as { kind?: string; groupId?: string | null; channelId?: string } | undefined;
    const overData = over.data.current as { kind?: string; groupId?: string | null } | undefined;

    if (activeData?.kind === "group") {
      const activeGroupId = parseGroupId(active.id);
      const overGroupId = parseGroupId(over.id);
      if (!activeGroupId || !overGroupId || activeGroupId === overGroupId) return;

      const oldIndex = groups.findIndex((group) => group.id === activeGroupId);
      const newIndex = groups.findIndex((group) => group.id === overGroupId);
      if (oldIndex < 0 || newIndex < 0) return;

      const orderedGroupIds = arrayMove(groups, oldIndex, newIndex).map((group) => group.id);
      void reorderGroups(orderedGroupIds);
      return;
    }

    if (activeData?.kind === "subscription") {
      const channelId = parseSubscriptionChannelId(active.id) ?? activeData.channelId;
      if (!channelId) return;

      const targetGroupId = resolveDropTargetGroupId(over.id, overData);
      if (targetGroupId === undefined) return;
      if ((activeData.groupId ?? null) === targetGroupId) return;

      void assignChannelToGroup(channelId, targetGroupId);
    }
  };

  const isLoading = isGroupsLoading || isSubscriptionsLoading;

  return (
    <div className="grouptube-modal-body">
      <div className="grouptube-toolbar">
        <button type="button" className="grouptube-button is-primary" onClick={() => setIsCreateGroupOpen(true)}>
          {labels.newGroupLabel}
        </button>
        <button type="button" className="grouptube-button" onClick={refresh}>
          {labels.refreshLabel}
        </button>
      </div>

      {isCreateGroupOpen ? (
        <GroupForm
          mode="create"
          labels={{
            namePlaceholder: labels.createNamePlaceholder,
            createLabel: labels.createLabel,
            saveLabel: labels.saveLabel,
            cancelLabel: labels.cancelLabel,
          }}
          onCancel={() => setIsCreateGroupOpen(false)}
          onSubmit={async (values) => {
            await createGroup(values);
            setIsCreateGroupOpen(false);
          }}
        />
      ) : null}

      {isLoading ? <p className="grouptube-info-text">{labels.loadingLabel}</p> : null}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis]}
        onDragEnd={handleDragEnd}
      >
        {groups.length > 0 ? (
          <GroupList
            groups={groups}
            subscriptionsByGroupId={subscriptionsByGroupId}
            labels={{
              editLabel: labels.groupEditLabel,
              deleteLabel: labels.groupDeleteLabel,
              expandLabel: labels.groupExpandLabel,
              collapseLabel: labels.groupCollapseLabel,
              emptyLabel: labels.groupEmptyLabel,
              dragGroupLabel: labels.groupDragHandleLabel,
              dragSubscriptionLabel: labels.subscriptionDragHandleLabel,
            }}
            formLabels={{
              namePlaceholder: labels.createNamePlaceholder,
              createLabel: labels.createLabel,
              saveLabel: labels.saveLabel,
              cancelLabel: labels.cancelLabel,
            }}
            onDeleteGroup={async (groupId) => {
              if (!window.confirm(labels.deleteGroupConfirm)) return;
              await deleteGroup(groupId);
            }}
            onUpdateGroup={updateGroup}
          />
        ) : (
          <p className="grouptube-info-text">{labels.noGroupsLabel}</p>
        )}

        <SubscriptionList
          title={labels.ungroupedTitle}
          emptyLabel={labels.ungroupedEmptyLabel}
          dragSubscriptionLabel={labels.subscriptionDragHandleLabel}
          subscriptions={ungroupedSubscriptions}
        />
      </DndContext>
    </div>
  );
}
