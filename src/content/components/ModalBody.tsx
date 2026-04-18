import { DndContext, PointerSensor, closestCenter, type DragEndEvent, type Modifier, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { LoaderCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useGroups } from "../hooks/useGroups";
import { useSubscriptions } from "../hooks/useSubscriptions";
import { buildGroupingPrompt } from "../services/grouping-prompt";
import { loadSubscriptionSort, saveSubscriptionSort, type SubscriptionSortMode } from "../services/subscription-sort";
import type { Subscription } from "../types";
import { GroupForm } from "./GroupForm";
import { GroupingPromptDialog } from "./GroupingPromptDialog";
import { GroupList } from "./GroupList";
import { SubscriptionList } from "./SubscriptionList";
import { UNGROUPED_DROP_ID, parseGroupId, parseSubscriptionChannelId } from "./dnd";

export type ModalBodyLabels = {
  newGroupLabel: string;
  refreshLabel: string;
  sortLabel: string;
  sortRelevanceLabel: string;
  sortNameAscLabel: string;
  sortNameDescLabel: string;
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
  openGroupingPromptLabel: string;
  promptDialogTitle: string;
  promptDialogDescription: string;
  promptDialogCloseLabel: string;
  promptDialogCopyLabel: string;
  promptDialogCopiedLabel: string;
  promptDialogCopyErrorLabel: string;
  promptDialogFieldLabel: string;
};

type ModalBodyProps = {
  labels: ModalBodyLabels;
};

const restrictToVerticalAxis: Modifier = ({ transform }) => ({
  ...transform,
  x: 0,
});

const NAME_COLLATOR = new Intl.Collator(undefined, { sensitivity: "base" });

function isSubscriptionSortMode(value: string): value is SubscriptionSortMode {
  return value === "relevance" || value === "nameAsc" || value === "nameDesc";
}

function sortSubscriptions(subscriptions: Subscription[], sortMode: SubscriptionSortMode): Subscription[] {
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
  const [isGroupingPromptOpen, setIsGroupingPromptOpen] = useState(false);
  const [sortMode, setSortMode] = useState<SubscriptionSortMode>("relevance");
  const { subscriptions, isLoading: isSubscriptionsLoading, refresh } = useSubscriptions();
  const {
    userId,
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

  useEffect(() => {
    let isCancelled = false;

    void loadSubscriptionSort(userId)
      .then((storedSortMode) => {
        if (!isCancelled) {
          setSortMode(storedSortMode);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setSortMode("relevance");
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [userId]);

  const sortedSubscriptions = useMemo(
    () => sortSubscriptions(subscriptions, sortMode),
    [subscriptions, sortMode]
  );

  const { subscriptionsByGroupId, ungroupedSubscriptions } = useMemo(() => {
    const grouped = new Map<string, Subscription[]>();
    for (const group of groups) {
      grouped.set(group.id, []);
    }

    const ungrouped: Subscription[] = [];
    for (const subscription of sortedSubscriptions) {
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
  }, [channelToGroupMap, groups, sortedSubscriptions]);

  const groupingPrompt = useMemo(
    () =>
      buildGroupingPrompt({
        groups,
        subscriptions,
        channelToGroupMap,
      }),
    [channelToGroupMap, groups, subscriptions]
  );

  const handleSortModeChange = (nextSortMode: SubscriptionSortMode) => {
    setSortMode(nextSortMode);
    void saveSubscriptionSort(userId, nextSortMode);
  };

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
        <button
          type="button"
          className="grouptube-button"
          onClick={() => setIsGroupingPromptOpen(true)}
          disabled={subscriptions.length === 0}
        >
          {labels.openGroupingPromptLabel}
        </button>
        <label className="grouptube-toolbar-select-wrap">
          <span className="grouptube-toolbar-select-label">{labels.sortLabel}</span>
          <select
            className="grouptube-toolbar-select"
            value={sortMode}
            onChange={(event) => {
              const nextSortMode = event.target.value;
              if (!isSubscriptionSortMode(nextSortMode)) return;
              handleSortModeChange(nextSortMode);
            }}
          >
            <option value="relevance">{labels.sortRelevanceLabel}</option>
            <option value="nameAsc">{labels.sortNameAscLabel}</option>
            <option value="nameDesc">{labels.sortNameDescLabel}</option>
          </select>
        </label>
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

      {isLoading ? (
        <div className="grouptube-loading" role="status" aria-live="polite">
          <LoaderCircle className="grouptube-loading-icon" aria-hidden="true" />
          <span>{labels.loadingLabel}</span>
        </div>
      ) : null}

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
            onUpdateGroup={async (groupId, values) => {
              await updateGroup(groupId, values);
            }}
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

      <GroupingPromptDialog
        isOpen={isGroupingPromptOpen}
        prompt={groupingPrompt}
        labels={{
          title: labels.promptDialogTitle,
          description: labels.promptDialogDescription,
          closeLabel: labels.promptDialogCloseLabel,
          copyLabel: labels.promptDialogCopyLabel,
          copiedLabel: labels.promptDialogCopiedLabel,
          copyErrorLabel: labels.promptDialogCopyErrorLabel,
          promptFieldLabel: labels.promptDialogFieldLabel,
        }}
        onClose={() => setIsGroupingPromptOpen(false)}
      />
    </div>
  );
}
