import * as stylex from "@stylexjs/stylex";
import { ArrowUp, AudioLines, ChevronDown, GraduationCap, Monitor, Paperclip, ShieldAlert, Target } from "lucide-react";
import { type FormEvent, useState } from "react";
import { IconButton } from "../../components/IconButton";

interface ComposerProps {
  placeholder: string;
  isDisabled: boolean;
  onSubmit: (value: string) => void;
}

export function Composer({ placeholder, isDisabled, onSubmit }: ComposerProps) {
  const [value, setValue] = useState("");
  const text = value.trim();
  const hasText = text.length > 0;

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!hasText || isDisabled) return;
    onSubmit(text);
    setValue("");
  }

  return (
    <form onSubmit={submit} {...stylex.props(styles.pill)}>
      <IconButton label="Attach a file" style={styles.tool}>
        <Paperclip size={18} strokeWidth={1.75} />
      </IconButton>
      <IconButton label="Skills" style={styles.tool}>
        <GraduationCap size={18} strokeWidth={1.75} />
      </IconButton>
      <button type="button" {...stylex.props(styles.chip)}>
        <Target size={15} strokeWidth={1.75} aria-hidden="true" />
        Goal
      </button>
      <IconButton label="Approvals" style={styles.tool}>
        <ShieldAlert size={18} strokeWidth={1.75} />
      </IconButton>
      <IconButton label="Bot screen" style={styles.tool}>
        <Monitor size={18} strokeWidth={1.75} />
      </IconButton>
      <input
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        {...stylex.props(styles.input)}
      />
      {hasText ? (
        <IconButton label="Send" type="submit" disabled={isDisabled} style={[styles.action, styles.send]}>
          <ArrowUp size={18} />
        </IconButton>
      ) : (
        <IconButton label="Talk" style={styles.action}>
          <AudioLines size={18} strokeWidth={1.75} />
        </IconButton>
      )}
      <IconButton label="More options" style={styles.action}>
        <ChevronDown size={16} />
      </IconButton>
    </form>
  );
}

const fill = "var(--color-overlay-pressed)";

const styles = stylex.create({
  pill: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    height: 46,
    paddingInline: 8,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "var(--color-border)",
    borderRadius: 22,
    color: "var(--color-text-primary)",
    backgroundColor: "var(--color-background-surface)",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.06)",
  },
  tool: {
    borderRadius: "50%",
    backgroundColor: {
      default: "transparent",
      ":hover": fill,
    },
  },
  chip: {
    display: "flex",
    flexShrink: 0,
    alignItems: "center",
    gap: 6,
    height: 30,
    paddingBlock: 0,
    paddingInline: 12,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "var(--color-border)",
    borderRadius: 9999,
    color: "var(--color-text-secondary)",
    fontSize: 13,
    cursor: "pointer",
    backgroundColor: {
      default: "transparent",
      ":hover": fill,
    },
  },
  input: {
    flexGrow: 1,
    minWidth: 0,
    marginInlineStart: 8,
    padding: 0,
    borderWidth: 0,
    color: "inherit",
    fontSize: 15,
    backgroundColor: "transparent",
    outline: "none",
    "::placeholder": {
      color: "var(--color-text-secondary)",
    },
  },
  action: {
    borderRadius: 10,
    color: "inherit",
    backgroundColor: fill,
  },
  send: {
    borderRadius: "50%",
    color: "var(--color-on-accent)",
    backgroundColor: "var(--color-accent)",
  },
});
