import * as stylex from "@stylexjs/stylex";
import type { ButtonHTMLAttributes } from "react";

interface IconButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-label" | "className" | "style" | "title"> {
  label: string;
  style?: stylex.StyleXStyles;
}

export function IconButton({ label, style, type = "button", ...props }: IconButtonProps) {
  return <button type={type} aria-label={label} title={label} {...props} {...stylex.props(styles.button, style)} />;
}

const styles = stylex.create({
  button: {
    display: "flex",
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    width: 32,
    height: 32,
    padding: 0,
    borderWidth: 0,
    borderRadius: 8,
    color: "var(--color-text-secondary)",
    cursor: "pointer",
    backgroundColor: {
      default: "transparent",
      ":hover": "var(--color-overlay-hover)",
    },
  },
});
