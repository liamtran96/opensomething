import * as stylex from "@stylexjs/stylex";
import { type BackdropId, backdropIds, backdropStyles, backdrops } from "./backdrops";

interface BackdropPickerProps {
  value: BackdropId;
  onChange: (id: BackdropId) => void;
}

export function BackdropPicker({ value, onChange }: BackdropPickerProps) {
  return (
    <div role="group" aria-label="Background" {...stylex.props(styles.row)}>
      {backdropIds.map((id) => (
        <button
          key={id}
          type="button"
          title={backdrops[id].label}
          aria-label={backdrops[id].label}
          aria-pressed={id === value}
          onClick={() => onChange(id)}
          {...stylex.props(styles.swatch, id === value && styles.selected)}
        >
          <span {...stylex.props(styles.fill, backdropStyles[id])} />
        </button>
      ))}
    </div>
  );
}

const styles = stylex.create({
  row: {
    display: "flex",
    gap: 8,
  },
  swatch: {
    width: 22,
    height: 22,
    padding: 0,
    overflow: "hidden",
    borderRadius: "50%",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "var(--color-border-emphasized)",
    cursor: "pointer",
    transitionProperty: "transform",
    transitionDuration: "120ms",
    transform: {
      default: "none",
      ":hover": "scale(1.15)",
    },
    outline: {
      default: "none",
      ":focus-visible": "2px solid var(--color-accent)",
    },
    outlineOffset: 2,
  },
  fill: {
    display: "block",
    width: "100%",
    height: "100%",
  },
  selected: {
    boxShadow: "0 0 0 2px var(--color-text-primary)",
  },
});
