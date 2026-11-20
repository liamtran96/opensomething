import * as stylex from "@stylexjs/stylex";
import { ArrowUp, AudioLines, ChevronDown, GraduationCap, Monitor, Paperclip, ShieldAlert, Target } from "lucide-react";
import { type FormEvent, useState } from "react";

interface ComposerProps {
  placeholder: string;
  isDisabled: boolean;
  onSubmit: (value: string) => void;
}

export function Composer({ placeholder, isDisabled, onSubmit }: ComposerProps) {
  const [value, setValue] = useState("");
  const hasText = value.trim().length > 0;

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!hasText || isDisabled) return;
    onSubmit(value);
    setValue("");
  }

  return (
    <form onSubmit={submit} {...stylex.props(styles.pill)}>
      <button type="button" aria-label="Attach a file" title="Attach a file" {...stylex.props(styles.tool)}>
        <Paperclip size={18} strokeWidth={1.75} />
      </button>
      <button type="button" aria-label="Skills" title="Skills" {...stylex.props(styles.tool)}>
        <GraduationCap size={18} strokeWidth={1.75} />
      </button>
      <button type="button" {...stylex.props(styles.chip)}>
        <Target size={15} strokeWidth={1.75} aria-hidden="true" />
        Goal
      </button>
      <button type="button" aria-label="Approvals" title="Approvals" {...stylex.props(styles.tool)}>
        <ShieldAlert size={18} strokeWidth={1.75} />
      </button>
      <button type="button" aria-label="Bot screen" title="Bot screen" {...stylex.props(styles.tool)}>
        <Monitor size={18} strokeWidth={1.75} />
      </button>
      <input
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        {...stylex.props(styles.input)}
      />
      {hasText ? (
        <button type="submit" aria-label="Send" disabled={isDisabled} {...stylex.props(styles.action, styles.send)}>
          <ArrowUp size={18} />
        </button>
      ) : (
        <button type="button" aria-label="Talk" title="Talk" {...stylex.props(styles.action)}>
          <AudioLines size={18} strokeWidth={1.75} />
        </button>
      )}
      <button type="button" aria-label="More options" title="More options" {...stylex.props(styles.action)}>
        <ChevronDown size={16} />
      </button>
    </form>
  );
}

const fill = "color-mix(in srgb, var(--color-text-primary) 8%, transparent)";

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
    display: "flex",
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    width: 32,
    height: 32,
    padding: 0,
    borderWidth: 0,
    borderRadius: "50%",
    color: "var(--color-text-secondary)",
    cursor: "pointer",
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
    display: "flex",
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    width: 32,
    height: 32,
    padding: 0,
    borderWidth: 0,
    borderRadius: 10,
    color: "inherit",
    cursor: "pointer",
    backgroundColor: fill,
  },
  send: {
    borderRadius: "50%",
    color: "var(--color-on-accent)",
    backgroundColor: "var(--color-accent)",
  },
});
