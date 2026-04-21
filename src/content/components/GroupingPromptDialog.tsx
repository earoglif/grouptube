import { type KeyboardEvent as ReactKeyboardEvent, type MouseEvent, useEffect, useState } from "react";

type CopyStatus = "idle" | "copied" | "error";

export type GroupingPromptDialogLabels = {
  title: string;
  description: string;
  closeLabel: string;
  copyLabel: string;
  copiedLabel: string;
  copyErrorLabel: string;
  promptFieldLabel: string;
};

type GroupingPromptDialogProps = {
  isOpen: boolean;
  prompt: string;
  labels: GroupingPromptDialogLabels;
  onClose: () => void;
};

const PROMPT_DIALOG_TITLE_ID = "grouptube-grouping-prompt-title";

export function GroupingPromptDialog({
  isOpen,
  prompt,
  labels,
  onClose,
}: GroupingPromptDialogProps) {
  const [copyStatus, setCopyStatus] = useState<CopyStatus>("idle");

  useEffect(() => {
    if (isOpen) {
      setCopyStatus("idle");
    }
  }, [isOpen, prompt]);

  if (!isOpen) {
    return null;
  }

  const onOverlayClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("error");
    }
  };

  const stopKeyboardPropagation = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    event.stopPropagation();
    event.nativeEvent.stopImmediatePropagation();
  };

  const onOverlayKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    stopKeyboardPropagation(event);
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    }
  };

  const onOverlayKeyUp = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    stopKeyboardPropagation(event);
  };

  return (
    <div
      className="grouptube-prompt-overlay"
      onClick={onOverlayClick}
      onKeyDown={onOverlayKeyDown}
      onKeyUp={onOverlayKeyUp}
      role="presentation"
    >
      <div className="grouptube-prompt-dialog" role="dialog" aria-modal="true" aria-labelledby={PROMPT_DIALOG_TITLE_ID}>
        <div className="grouptube-prompt-header">
          <h3 id={PROMPT_DIALOG_TITLE_ID} className="grouptube-prompt-title">
            {labels.title}
          </h3>
          <button type="button" className="grouptube-icon-button" aria-label={labels.closeLabel} onClick={onClose}>
            ×
          </button>
        </div>

        <div className="grouptube-prompt-body">
          <p className="grouptube-info-text">{labels.description}</p>

          <textarea
            className="grouptube-prompt-textarea"
            readOnly
            value={prompt}
            aria-label={labels.promptFieldLabel}
          />

          <div className="grouptube-inline-actions grouptube-prompt-actions">
            <button type="button" className="grouptube-button is-primary" onClick={copyPrompt}>
              {copyStatus === "copied" ? labels.copiedLabel : labels.copyLabel}
            </button>
          </div>

          {copyStatus === "error" ? <p className="grouptube-info-text">{labels.copyErrorLabel}</p> : null}
        </div>
      </div>
    </div>
  );
}
