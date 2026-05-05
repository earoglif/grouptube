import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { logger } from "../shared/logger";
import { notify } from "../shared/services/notifications";
import modalStyles from "./groups-modal.css?inline";
import { ensureShadowMount } from "./mount";
import { AssignGroupDialog } from "./components/AssignGroupDialog";
import { useGroups } from "./hooks/useGroups";
import { t } from "./i18n";
import { removeSubscriptions, requestChannelDetails, requestSubscriptions, upsertSubscription } from "./services/subscriptions";
import {
  initSubscribeWatcher,
  initUnsubscribeWatcher,
  type SubscribedChannelInfo,
} from "./services/subscribe-watcher";

const ROOT_HOST_ID = "grouptube-subscribe-assign-host";
const STYLE_ELEMENT_ID = "grouptube-subscribe-assign-shadow-styles";
const ROOT_ELEMENT_ID = "grouptube-subscribe-assign-shadow-root";
const DEBUG_PREFIX = "[grouptube/subscribe-assign]";

function SubscribeAssignRoot() {
  const [pendingChannel, setPendingChannel] = useState<SubscribedChannelInfo | null>(null);
  const { groups, assignChannelToGroup, assignChannelsToGroup, createGroupAndAssignChannel } = useGroups();

  useEffect(() => {
    logger.debug(`${DEBUG_PREFIX} mount; initSubscribeWatcher`);
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
          logger.debug(`${DEBUG_PREFIX} set pending channel`, resolved);
          setPendingChannel(resolved);
        })
        .catch(() => {
          notify.error("Failed to fetch channel details");
          upsertSubscription({
            channelId: fallbackInfo.channelId,
            name: fallbackInfo.name,
            thumbnailUrl: fallbackInfo.thumbnailUrl,
          });
          logger.debug(`${DEBUG_PREFIX} set pending channel (fallback)`, fallbackInfo);
          setPendingChannel(fallbackInfo);
        });
    });
    const stopUnsubscribe = initUnsubscribeWatcher((channelIds) => {
      removeSubscriptions(channelIds);
      requestSubscriptions();
      void assignChannelsToGroup(channelIds, null);
      setPendingChannel((current) =>
        current && channelIds.includes(current.channelId) ? null : current
      );
    });
    return () => {
      stopSubscribe();
      stopUnsubscribe();
    };
  }, [assignChannelToGroup, assignChannelsToGroup]);

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
    logger.debug(`${DEBUG_PREFIX} already initialized`);
    return;
  }

  const host = document.createElement("div");
  host.id = ROOT_HOST_ID;
  document.body.append(host);
  const mountRoot = ensureShadowMount({
    host,
    styleId: STYLE_ELEMENT_ID,
    rootId: ROOT_ELEMENT_ID,
    styles: modalStyles,
  });

  logger.debug(`${DEBUG_PREFIX} create react root`);
  createRoot(mountRoot).render(<SubscribeAssignRoot />);
}
