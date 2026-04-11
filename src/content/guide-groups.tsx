import { useState } from "react";
import { createRoot } from "react-dom/client";
import styles from "./guide-groups.css?inline";
import { GroupsModal } from "./groups-modal";
import { t } from "./i18n";

const GROUPS_SECTION_ID = "grouptube-groups-section";

type GuideGroupsButtonProps = {
  onClick: () => void;
};

function GuideGroupsButton({ onClick }: GuideGroupsButtonProps) {
  return (
    <button type="button" className="guide-groups-item" onClick={onClick}>
      <span className="guide-groups-label">{t("groups")}</span>
    </button>
  );
}

function GuideGroupsSection() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="guide-groups-container">
      <div className="guide-groups-section">
        <GuideGroupsButton onClick={() => setIsModalOpen(true)} />
      </div>
      <GroupsModal
        isOpen={isModalOpen}
        title={t("manageGroups")}
        labels={{
          closeLabel: t("close"),
          newGroupLabel: t("newGroup"),
          refreshLabel: t("refresh"),
          loadingLabel: t("loading"),
          noGroupsLabel: t("noGroups"),
          ungroupedTitle: t("ungroupedSubscriptions"),
          ungroupedEmptyLabel: t("ungroupedEmpty"),
          groupEmptyLabel: t("groupEmpty"),
          groupEditLabel: t("edit"),
          groupDeleteLabel: t("delete"),
          groupExpandLabel: t("expandGroup"),
          groupCollapseLabel: t("collapseGroup"),
          groupDragHandleLabel: t("dragGroup"),
          subscriptionDragHandleLabel: t("dragSubscription"),
          createNamePlaceholder: t("groupNamePlaceholder"),
          createLabel: t("createGroupAction"),
          saveLabel: t("save"),
          cancelLabel: t("cancel"),
          deleteGroupConfirm: t("deleteGroupConfirm"),
        }}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}

function injectGroupsSection(): boolean {
  if (document.getElementById(GROUPS_SECTION_ID)) return true;

  const sectionsContainer = document.querySelector(
    "ytd-guide-renderer#guide-renderer #sections"
  );
  if (!sectionsContainer) return false;

  const sectionRenderers = sectionsContainer.querySelectorAll(
    ":scope > ytd-guide-section-renderer"
  );
  if (sectionRenderers.length < 2) return false;

  const subscriptionsSection = sectionRenderers[1];
  const container = document.createElement("div");
  container.id = GROUPS_SECTION_ID;
  container.className = "style-scope ytd-guide-renderer";
  sectionsContainer.insertBefore(container, subscriptionsSection);

  const shadowRoot = container.attachShadow({ mode: "open" });
  const styleElement = document.createElement("style");
  styleElement.textContent = styles;

  const reactContainer = document.createElement("div");
  shadowRoot.append(styleElement, reactContainer);

  createRoot(reactContainer).render(<GuideGroupsSection />);

  return true;
}

export function initGuideGroups(): void {
  if (injectGroupsSection()) return;

  const observer = new MutationObserver(() => {
    if (injectGroupsSection()) {
      observer.disconnect();
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}
