import { type Dispatch, type MouseEvent, type SetStateAction, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import modalStyles from "./groups-modal.css?inline";
import { ModalBody, type ModalBodyLabels } from "./components/ModalBody";
import { ModalHeader } from "./components/ModalHeader";

const MODAL_TITLE_ID = "grouptube-manage-groups-modal-title";
const MODAL_HOST_ID = "grouptube-modal-host";
const MODAL_ROOT_ID = "grouptube-modal-root";
const MODAL_STYLE_ID = "grouptube-modal-styles";

const COLLAPSED_GROUPS_STORAGE_PREFIX = "grouptube_collapsed_groups_";

function collapsedGroupsStorageKey(userId: string | null): string {
  return userId ? `${COLLAPSED_GROUPS_STORAGE_PREFIX}${userId}` : `${COLLAPSED_GROUPS_STORAGE_PREFIX}anonymous`;
}

function loadCollapsedGroupIdsFromStorage(userId: string | null): Set<string> {
  if (typeof localStorage === "undefined") {
    return new Set();
  }

  try {
    const raw = localStorage.getItem(collapsedGroupsStorageKey(userId));
    if (!raw) {
      return new Set();
    }

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return new Set();
    }

    return new Set(parsed.filter((id): id is string => typeof id === "string"));
  } catch {
    return new Set();
  }
}

function saveCollapsedGroupIdsToStorage(userId: string | null, collapsedIds: Set<string>): void {
  if (typeof localStorage === "undefined") {
    return;
  }

  try {
    localStorage.setItem(collapsedGroupsStorageKey(userId), JSON.stringify([...collapsedIds]));
  } catch {
    // ignore quota / private mode
  }
}

export function useCollapsedGroupsPersistence(userId: string | null): [
  Set<string>,
  Dispatch<SetStateAction<Set<string>>>,
] {
  const [collapsedGroupIds, setCollapsedGroupIds] = useState(() => loadCollapsedGroupIdsFromStorage(userId));

  useEffect(() => {
    setCollapsedGroupIds(loadCollapsedGroupIdsFromStorage(userId));
  }, [userId]);

  useEffect(() => {
    saveCollapsedGroupIdsToStorage(userId, collapsedGroupIds);
  }, [userId, collapsedGroupIds]);

  return [collapsedGroupIds, setCollapsedGroupIds];
}

export type GroupsModalLabels = ModalBodyLabels & {
  closeLabel: string;
};

type GroupsModalProps = {
  isOpen: boolean;
  title: string;
  labels: GroupsModalLabels;
  onClose: () => void;
};

function ensureModalRoot(): HTMLElement {
  let host = document.getElementById(MODAL_HOST_ID);
  if (!host) {
    host = document.createElement("div");
    host.id = MODAL_HOST_ID;
    document.body.append(host);
  }

  const shadowRoot = host.shadowRoot ?? host.attachShadow({ mode: "open" });

  let styleElement = shadowRoot.getElementById(MODAL_STYLE_ID);
  if (!styleElement) {
    styleElement = document.createElement("style");
    styleElement.id = MODAL_STYLE_ID;
    styleElement.textContent = modalStyles;
    shadowRoot.append(styleElement);
  }

  let modalRoot = shadowRoot.getElementById(MODAL_ROOT_ID);
  if (!modalRoot) {
    modalRoot = document.createElement("div");
    modalRoot.id = MODAL_ROOT_ID;
    shadowRoot.append(modalRoot);
  }

  return modalRoot;
}

export function GroupsModal({ isOpen, title, labels, onClose }: GroupsModalProps) {
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setPortalRoot(ensureModalRoot());
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    const prevBodyPaddingRight = body.style.paddingRight;

    const scrollbarWidth = window.innerWidth - html.clientWidth;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
      body.style.paddingRight = prevBodyPaddingRight;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !portalRoot) return null;

  const onOverlayClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return createPortal(
    <div className="grouptube-overlay" onClick={onOverlayClick} role="presentation">
      <div className="grouptube-modal" role="dialog" aria-modal="true" aria-labelledby={MODAL_TITLE_ID}>
        <ModalHeader title={title} titleId={MODAL_TITLE_ID} closeLabel={labels.closeLabel} onClose={onClose} />
        <ModalBody labels={labels} />
      </div>
    </div>,
    portalRoot
  );
}
