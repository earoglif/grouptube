import { type MouseEvent, useEffect } from "react";
import { createPortal } from "react-dom";

const MODAL_TITLE_ID = "grouptube-manage-groups-modal-title";

type GroupsModalProps = {
  isOpen: boolean;
  title: string;
  onClose: () => void;
};

const overlayStyle = {
  position: "fixed",
  inset: 0,
  zIndex: 2147483647,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "16px",
  background: "rgba(0, 0, 0, 0.58)",
} as const;

const contentStyle = {
  width: "min(560px, calc(100vw - 32px))",
  maxHeight: "calc(100vh - 32px)",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  borderRadius: "12px",
  border: "1px solid var(--yt-spec-10-percent-layer, rgba(0, 0, 0, 0.12))",
  background: "var(--yt-spec-base-background, #fff)",
  boxShadow: "0 16px 48px rgba(0, 0, 0, 0.32)",
  color: "var(--yt-spec-text-primary, #0f0f0f)",
  fontFamily: "\"Roboto\", \"Arial\", sans-serif",
} as const;

const headerStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  padding: "16px 20px",
  borderBottom: "1px solid var(--yt-spec-10-percent-layer, rgba(0, 0, 0, 0.12))",
} as const;

const titleStyle = {
  margin: 0,
  fontSize: "2rem",
  lineHeight: "2.8rem",
  fontWeight: 500,
} as const;

const closeButtonStyle = {
  width: "32px",
  height: "32px",
  padding: 0,
  border: "none",
  borderRadius: "999px",
  background: "transparent",
  color: "var(--yt-spec-text-primary, #0f0f0f)",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "2rem",
  lineHeight: 1,
} as const;

const bodyStyle = {
  padding: "20px",
  fontSize: "1.4rem",
  lineHeight: "2rem",
  color: "var(--yt-spec-text-secondary, #606060)",
} as const;

export function GroupsModal({ isOpen, title, onClose }: GroupsModalProps) {
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

  if (!isOpen) return null;

  const onOverlayClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return createPortal(
    <div style={overlayStyle} onClick={onOverlayClick} role="presentation">
      <div
        style={contentStyle}
        role="dialog"
        aria-modal="true"
        aria-labelledby={MODAL_TITLE_ID}
      >
        <div style={headerStyle}>
          <h2 id={MODAL_TITLE_ID} style={titleStyle}>
            {title}
          </h2>
          <button type="button" aria-label="Close" style={closeButtonStyle} onClick={onClose}>
            ×
          </button>
        </div>
        <div style={bodyStyle} />
      </div>
    </div>,
    document.body
  );
}
