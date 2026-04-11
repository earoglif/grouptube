import { type MouseEvent, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import modalStyles from "./groups-modal.css?inline";
import { ModalBody, type ModalBodyLabels } from "./components/ModalBody";
import { ModalHeader } from "./components/ModalHeader";

const MODAL_TITLE_ID = "grouptube-manage-groups-modal-title";
const MODAL_HOST_ID = "grouptube-modal-host";
const MODAL_ROOT_ID = "grouptube-modal-root";
const MODAL_STYLE_ID = "grouptube-modal-styles";

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
