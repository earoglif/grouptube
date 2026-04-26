import {
  DndContext,
  PointerSensor,
  closestCenter,
  pointerWithin,
  type CollisionDetection,
  type DragEndEvent,
  type Modifier,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import type { ChannelId, GroupId, IGroup } from "../../../shared/types";
import { UNGROUPED_DROP_ID, parseGroupId, parseSubscriptionChannelId } from "../../components/dnd";

const restrictToVerticalAxis: Modifier = ({ transform }) => ({
  ...transform,
  x: 0,
});

const pointerThenClosestCenter: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);
  if (pointerCollisions.length > 0) return pointerCollisions;
  return closestCenter(args);
};

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

type UseGroupsDndInput = {
  groups: IGroup[];
  reorderGroups: (groupIds: GroupId[]) => Promise<IGroup[]>;
  assignChannelToGroup: (channelId: ChannelId, targetGroupId: GroupId | null) => Promise<IGroup[]>;
};

export function useGroupsDnd({ groups, reorderGroups, assignChannelToGroup }: UseGroupsDndInput) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

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

  return {
    DndContext,
    sensors,
    collisionDetection: pointerThenClosestCenter,
    modifiers: [restrictToVerticalAxis] as Modifier[],
    handleDragEnd,
  };
}
