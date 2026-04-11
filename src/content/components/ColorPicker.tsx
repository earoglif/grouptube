export const GROUP_COLORS = [
  "#ff4e45",
  "#3ea6ff",
  "#41c057",
  "#8e63ff",
  "#ff9f1a",
  "#00b5ad",
  "#ff5fa2",
  "#ffd166",
] as const;

type ColorPickerProps = {
  value: string;
  onChange: (color: string) => void;
};

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="grouptube-color-picker">
      {GROUP_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          className={`grouptube-color-dot${value === color ? " is-active" : ""}`}
          style={{ backgroundColor: color }}
          onClick={() => onChange(color)}
          aria-label={color}
        />
      ))}
    </div>
  );
}
