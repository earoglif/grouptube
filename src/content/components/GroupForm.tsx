import { type FormEvent, useMemo, useState } from "react";
import { ColorPicker, GROUP_COLORS } from "./ColorPicker";

export type GroupFormValues = {
  name: string;
  color: string;
};

export type GroupFormLabels = {
  namePlaceholder: string;
  createLabel: string;
  saveLabel: string;
  cancelLabel: string;
};

type GroupFormProps = {
  mode: "create" | "edit";
  labels: GroupFormLabels;
  initialName?: string;
  initialColor?: string;
  onSubmit: (values: GroupFormValues) => Promise<void> | void;
  onCancel: () => void;
};

export function GroupForm({ mode, labels, initialName, initialColor, onSubmit, onCancel }: GroupFormProps) {
  const [name, setName] = useState(initialName ?? "");
  const [color, setColor] = useState(initialColor ?? GROUP_COLORS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitLabel = useMemo(() => (mode === "create" ? labels.createLabel : labels.saveLabel), [labels, mode]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;

    setIsSubmitting(true);
    try {
      await onSubmit({ name: trimmedName, color });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="grouptube-group-form" onSubmit={handleSubmit}>
      <input
        className="grouptube-input"
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder={labels.namePlaceholder}
        maxLength={40}
      />
      <ColorPicker value={color} onChange={setColor} />
      <div className="grouptube-inline-actions">
        <button type="submit" className="grouptube-button is-primary" disabled={!name.trim() || isSubmitting}>
          {submitLabel}
        </button>
        <button type="button" className="grouptube-button" onClick={onCancel} disabled={isSubmitting}>
          {labels.cancelLabel}
        </button>
      </div>
    </form>
  );
}
