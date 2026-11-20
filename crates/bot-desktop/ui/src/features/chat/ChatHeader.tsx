import * as stylex from "@stylexjs/stylex";
import { ChevronDown, List, Monitor, MoreHorizontal, Pencil, Signal } from "lucide-react";
import type { Bot } from "../../mocks/bots";
import { BotAvatar } from "../bots/BotAvatar";

export function ChatHeader({ bot }: { bot: Bot }) {
  return (
    <header {...stylex.props(styles.header)}>
      <div {...stylex.props(styles.side)}>
        <button type="button" {...stylex.props(styles.pill, styles.quiet)}>
          <List size={15} aria-hidden="true" />
          Chat activity
        </button>
      </div>
      <button type="button" title="Open the bot panel" {...stylex.props(styles.pill, styles.identity)}>
        <BotAvatar bot={bot} size={24} />
        <span {...stylex.props(styles.name)}>{bot.name}</span>
        <Pencil size={13} aria-hidden="true" {...stylex.props(styles.faint)} />
      </button>
      <div {...stylex.props(styles.side, styles.end)}>
        <button type="button" title="Model" {...stylex.props(styles.pill)}>
          {bot.model}
          <Signal size={14} aria-hidden="true" {...stylex.props(styles.faint)} />
          <ChevronDown size={14} aria-hidden="true" {...stylex.props(styles.faint)} />
        </button>
        <button type="button" aria-label="Bot screen" title="Bot screen" {...stylex.props(styles.pill, styles.round)}>
          <Monitor size={16} strokeWidth={1.75} />
        </button>
        <button type="button" aria-label="More" title="More" {...stylex.props(styles.more)}>
          <MoreHorizontal size={18} />
        </button>
      </div>
    </header>
  );
}

const hover = "color-mix(in srgb, var(--color-text-primary) 5%, transparent)";

const styles = stylex.create({
  header: {
    display: "grid",
    flexShrink: 0,
    gridTemplateColumns: "minmax(0, 1fr) minmax(0, auto) minmax(max-content, 1fr)",
    alignItems: "center",
    gap: 12,
    height: 56,
    paddingInline: 20,
    color: "var(--color-text-primary)",
  },
  side: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    minWidth: 0,
  },
  end: {
    justifyContent: "flex-end",
  },
  pill: {
    display: "flex",
    flexShrink: 0,
    alignItems: "center",
    gap: 8,
    height: 30,
    paddingBlock: 0,
    paddingInline: 12,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "var(--color-border)",
    borderRadius: 9999,
    color: "inherit",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    backgroundColor: {
      default: "var(--color-background-surface)",
      ":hover": "var(--color-background-body)",
    },
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
  },
  quiet: {
    color: "var(--color-text-secondary)",
    fontWeight: 400,
    backgroundColor: "var(--color-background-body)",
    boxShadow: "none",
  },
  identity: {
    minWidth: 0,
    paddingInlineStart: 4,
  },
  name: {
    overflow: "hidden",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
  },
  round: {
    justifyContent: "center",
    width: 34,
    height: 34,
    paddingInline: 0,
  },
  more: {
    display: "flex",
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
      ":hover": hover,
    },
  },
  faint: {
    flexShrink: 0,
    color: "var(--color-text-secondary)",
  },
});
