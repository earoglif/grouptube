type ModalHeaderProps = {
  title: string;
  titleId?: string;
  closeLabel: string;
  onClose: () => void;
};

export function ModalHeader({ title, titleId, closeLabel, onClose }: ModalHeaderProps) {
  return (
    <div className="grouptube-modal-header">
      <h2 id={titleId} className="grouptube-modal-title">
        {title}
      </h2>
      <button type="button" aria-label={closeLabel} className="grouptube-icon-button" onClick={onClose}>
        ×
      </button>
    </div>
  );
}
