import { BotMessageSquare, RefreshCw } from "lucide-react";

type ModalHeaderProps = {
  title: string;
  titleId?: string;
  openGroupingPromptLabel: string;
  onOpenGroupingPrompt: () => void;
  groupingPromptDisabled?: boolean;
  refreshLabel: string;
  onRefresh: () => void;
  closeLabel: string;
  onClose: () => void;
};

export function ModalHeader({
  title,
  titleId,
  openGroupingPromptLabel,
  onOpenGroupingPrompt,
  groupingPromptDisabled,
  refreshLabel,
  onRefresh,
  closeLabel,
  onClose,
}: ModalHeaderProps) {
  return (
    <div className="grouptube-modal-header">
      <h2 id={titleId} className="grouptube-modal-title">
        {title}
      </h2>
      <div className="grouptube-modal-header-actions">
        <button
          type="button"
          className="grouptube-icon-button"
          aria-label={openGroupingPromptLabel}
          title={openGroupingPromptLabel}
          disabled={groupingPromptDisabled}
          onClick={onOpenGroupingPrompt}
        >
          <BotMessageSquare size={20} strokeWidth={2} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="grouptube-icon-button"
          aria-label={refreshLabel}
          title={refreshLabel}
          onClick={onRefresh}
        >
          <RefreshCw size={20} strokeWidth={2} aria-hidden="true" />
        </button>
        <button type="button" aria-label={closeLabel} className="grouptube-icon-button" onClick={onClose}>
          ×
        </button>
      </div>
    </div>
  );
}
