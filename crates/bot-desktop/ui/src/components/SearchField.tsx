import * as stylex from "@stylexjs/stylex";
import { Search } from "lucide-react";
import type { ReactNode } from "react";

interface SearchFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  style?: stylex.StyleXStyles;
  children?: ReactNode;
}

export function SearchField({ label, value, onChange, style, children }: SearchFieldProps) {
  return (
    <label {...stylex.props(styles.field, style)}>
      <Search size={15} aria-hidden="true" />
      <input
        aria-label={label}
        placeholder={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        {...stylex.props(styles.input)}
      />
      {children}
    </label>
  );
}

const styles = stylex.create({
  field: {
    display: "flex",
    flexShrink: 0,
    alignItems: "center",
    gap: 8,
    height: 32,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "var(--color-border)",
    color: "var(--color-text-secondary)",
  },
  input: {
    flexGrow: 1,
    minWidth: 0,
    padding: 0,
    borderWidth: 0,
    color: "var(--color-text-primary)",
    fontSize: 13,
    backgroundColor: "transparent",
    outline: "none",
  },
});
