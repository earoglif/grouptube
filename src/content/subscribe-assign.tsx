import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import modalStyles from "./groups-modal.css?inline";
import { AssignGroupDialog } from "./components/AssignGroupDialog";
import { useGroups } from "./hooks/useGroups";
import { t } from "./i18n";
import { removeSubscriptions, requestChannelDetails, upsertSubscription } from "./services/subscriptions";
import {
  initSubscribeWatcher,
  initUnsubscribeWatcher,
  type SubscribedChannelInfo,
} from "./services/subscribe-watcher";

const ROOT_HOST_ID = "grouptube-subscribe-assign-host";
const STYLE_ELEMENT_ID = "grouptube-subscribe-assign-styles";
const DEBUG_PREFIX = "[grouptube/subscribe-assign]";

function ensureStylesInjected(): void {
  if (document.getElementById(STYLE_ELEMENT_ID)) return;
  const styleElement = document.createElement("style");
  styleElement.id = STYLE_ELEMENT_ID;
  styleElement.textContent = modalStyles;
  document.head.append(styleElement);
}

function SubscribeAssignRoot() {
  const [pendingChannel, setPendingChannel] = useState<SubscribedChannelInfo | null>(null);
  const { groups, assignChannelToGroup, createGroupAndAssignChannel } = useGroups();

  useEffect(() => {
    console.log(`${DEBUG_PREFIX} mount; initSubscribeWatcher`);
    const stopSubscribe = initSubscribeWatcher((info) => {
      const fallbackInfo: SubscribedChannelInfo = {
        channelId: info.channelId,
        name: info.name.trim() || info.channelId,
        thumbnailUrl: info.thumbnailUrl,
      };

      void requestChannelDetails(info.channelId)
        .then((subscription) => {
          const resolved = subscription
            ? {
                channelId: subscription.channelId,
                name: subscription.name.trim() || fallbackInfo.name,
                thumbnailUrl: subscription.thumbnailUrl ?? fallbackInfo.thumbnailUrl,
              }
            : fallbackInfo;

          upsertSubscription({
            channelId: resolved.channelId,
            name: resolved.name,
            thumbnailUrl: resolved.thumbnailUrl,
          });
          console.log(`${DEBUG_PREFIX} set pending channel`, resolved);
          setPendingChannel(resolved);
        })
        .catch(() => {
          upsertSubscription({
            channelId: fallbackInfo.channelId,
            name: fallbackInfo.name,
            thumbnailUrl: fallbackInfo.thumbnailUrl,
          });
          console.log(`${DEBUG_PREFIX} set pending channel (fallback)`, fallbackInfo);
          setPendingChannel(fallbackInfo);
        });
    });
    const stopUnsubscribe = initUnsubscribeWatcher((channelIds) => {
      removeSubscriptions(channelIds);
      for (const channelId of channelIds) {
        void assignChannelToGroup(channelId, null);
      }
      setPendingChannel((current) =>
        current && channelIds.includes(current.channelId) ? null : current
      );
    });
    return () => {
      stopSubscribe();
      stopUnsubscribe();
    };
  }, [assignChannelToGroup]);

  if (!pendingChannel) return null;

  const handleClose = () => {
    setPendingChannel(null);
  };

  const handleAssignExisting = async (groupId: string) => {
    await assignChannelToGroup(pendingChannel.channelId, groupId);
    setPendingChannel(null);
  };

  const handleCreateAndAssign = async (values: { name: string; color: string }) => {
    await createGroupAndAssignChannel(pendingChannel.channelId, values);
    setPendingChannel(null);
  };

  return (
    <AssignGroupDialog
      channel={pendingChannel}
      groups={groups}
      labels={{
        title: t("assignGroupTitle"),
        description: t("assignGroupDescription"),
        skipLabel: t("assignSkipLabel"),
        closeLabel: t("close"),
        createNewGroupLabel: t("assignCreateNewGroupLabel"),
        createNamePlaceholder: t("groupNamePlaceholder"),
        colorPickerLabel: t("groupColorPicker"),
        createLabel: t("createGroupAction"),
        saveLabel: t("save"),
        cancelLabel: t("cancel"),
      }}
      onAssignToExisting={handleAssignExisting}
      onCreateAndAssign={handleCreateAndAssign}
      onClose={handleClose}
    />
  );
}

export function initSubscribeAssign(): void {
  if (document.getElementById(ROOT_HOST_ID)) {
    console.log(`${DEBUG_PREFIX} already initialized`);
    return;
  }

  ensureStylesInjected();

  const host = document.createElement("div");
  host.id = ROOT_HOST_ID;
  document.body.append(host);

  console.log(`${DEBUG_PREFIX} create react root`);
  createRoot(host).render(<SubscribeAssignRoot />);
}
