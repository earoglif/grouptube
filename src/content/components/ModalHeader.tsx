import { BotMessageSquare, Download, RefreshCw, Upload } from "lucide-react";

type ModalHeaderProps = {
  title: string;
  titleId?: string;
  openGroupingPromptLabel: string;
  onOpenGroupingPrompt: () => void;
  groupingPromptDisabled?: boolean;
  refreshLabel: string;
  onRefresh: () => void;
  exportLabel: string;
  onExport: () => void;
  importLabel: string;
  onImport: () => void;
  actionsDisabled?: boolean;
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
  exportLabel,
  onExport,
  importLabel,
  onImport,
  actionsDisabled,
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
          aria-label={exportLabel}
          title={exportLabel}
          disabled={actionsDisabled}
          onClick={onExport}
        >
          <Upload size={20} strokeWidth={2} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="grouptube-icon-button"
          aria-label={importLabel}
          title={importLabel}
          disabled={actionsDisabled}
          onClick={onImport}
        >
          <Download size={20} strokeWidth={2} aria-hidden="true" />
        </button>
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
