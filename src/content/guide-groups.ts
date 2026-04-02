import { t } from "./i18n";

const GROUPS_SECTION_ID = "grouptube-groups-section";

function createGroupsSection(): HTMLElement {
  const section = document.createElement("div");
  section.id = GROUPS_SECTION_ID;
  section.setAttribute("class", "style-scope ytd-guide-renderer");

  section.innerHTML = `
    <div style="padding: 12px 0;">
      <h3 style="
        padding: 6px 12px 4px 12px;
        font-size: 1.6rem;
        line-height: 2rem;
        font-weight: 500;
        color: var(--yt-spec-text-primary);
        font-family: 'Roboto', 'Arial', sans-serif;
      ">${t("groups")}</h3>
      <div id="grouptube-groups-list" style="padding: 0 12px;">
      </div>
    </div>
    <hr style="
      border: none;
      border-top: 1px solid var(--yt-spec-10-percent-layer);
      margin: 0;
    " />
  `;

  return section;
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
  const groupsSection = createGroupsSection();
  sectionsContainer.insertBefore(groupsSection, subscriptionsSection);

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
