import * as stylex from "@stylexjs/stylex";
import {
  ChevronDown,
  Crown,
  FolderPlus,
  Inbox,
  Laptop,
  type LucideIcon,
  MoreHorizontal,
  Plus,
  Puzzle,
  Rocket,
  Users,
  Zap,
} from "lucide-react";
import { type ReactNode, useState } from "react";
import { IconButton } from "../../components/IconButton";
import { SearchField } from "../../components/SearchField";
import { BotAvatar } from "../bots/BotAvatar";
import type { Bot } from "../bots/types";

const tools: { label: string; icon: LucideIcon }[] = [
  { label: "Automations", icon: Zap },
  { label: "Team map", icon: Users },
  { label: "Published apps", icon: Rocket },
];

interface SidebarProps {
  bots: Bot[];
  selectedId: string;
  onSelect: (id: string) => void;
  picture: stylex.StyleXStyles;
  account: ReactNode;
}

export function Sidebar({ bots, selectedId, onSelect, picture, account }: SidebarProps) {
  const [query, setQuery] = useState("");
  const [botsOpen, setBotsOpen] = useState(true);
  const [toolsOpen, setToolsOpen] = useState(true);
  const needle = query.trim().toLowerCase();
  const matches = (bot: Bot) => bot.name.toLowerCase().includes(needle);
  const chief = bots.find((bot) => bot.isChief && matches(bot));
  const team = bots.filter((bot) => !bot.isChief && matches(bot));

  return (
    <nav aria-label="Bots" {...stylex.props(styles.sidebar)}>
      <div aria-hidden="true" {...stylex.props(styles.tint, picture)} />
      <div {...stylex.props(styles.top)}>
        <button type="button" {...stylex.props(styles.place)}>
          <Laptop size={16} strokeWidth={1.75} aria-hidden="true" />
          This computer
          <ChevronDown size={14} aria-hidden="true" />
        </button>
        <IconButton label="New bot" style={styles.small}>
          <Plus size={18} strokeWidth={1.75} />
        </IconButton>
      </div>
      <SearchField label="Search" value={query} onChange={setQuery} style={styles.search} />
      <div {...stylex.props(styles.scroll)}>
        <button type="button" {...stylex.props(styles.row, styles.inbox)}>
          <span {...stylex.props(styles.inboxIcon)}>
            <Inbox size={18} strokeWidth={1.75} aria-hidden="true" />
          </span>
          Inbox
        </button>
        {chief && (
          <BotRow bot={chief} isSelected={chief.id === selectedId} onSelect={onSelect}>
            <span aria-label="New thread" title="New thread" {...stylex.props(styles.rowAction)}>
              <Plus size={15} />
            </span>
            <span aria-label="New folder" title="New folder" {...stylex.props(styles.rowAction)}>
              <FolderPlus size={15} />
            </span>
          </BotRow>
        )}
        <GroupLabel label="Bots" isOpen={botsOpen} onToggle={() => setBotsOpen((open) => !open)} />
        {botsOpen && team.map((bot) => <BotRow key={bot.id} bot={bot} isSelected={bot.id === selectedId} onSelect={onSelect} />)}
      </div>
      <div {...stylex.props(styles.tools)}>
        <GroupLabel label="Tools" isOpen={toolsOpen} onToggle={() => setToolsOpen((open) => !open)} />
        {toolsOpen &&
          tools.map(({ label, icon: ToolIcon }) => (
            <button key={label} type="button" {...stylex.props(styles.row, styles.tool)}>
              <ToolIcon size={18} strokeWidth={1.75} aria-hidden="true" />
              {label}
            </button>
          ))}
      </div>
      <div {...stylex.props(styles.footer)}>
        {account}
        <IconButton label="Plugins" style={styles.small}>
          <Puzzle size={18} strokeWidth={1.75} />
        </IconButton>
      </div>
    </nav>
  );
}

function GroupLabel({ label, isOpen, onToggle }: { label: string; isOpen: boolean; onToggle: () => void }) {
  return (
    <button type="button" aria-expanded={isOpen} onClick={onToggle} {...stylex.props(styles.groupLabel)}>
      {label}
      <ChevronDown size={13} aria-hidden="true" {...stylex.props(!isOpen && styles.closed)} />
    </button>
  );
}

interface BotRowProps {
  bot: Bot;
  isSelected: boolean;
  onSelect: (id: string) => void;
  children?: ReactNode;
}

function BotRow({ bot, isSelected, onSelect, children }: BotRowProps) {
  return (
    <div {...stylex.props(styles.botRow, isSelected && styles.selected)}>
      <button
        type="button"
        aria-current={isSelected ? "true" : undefined}
        onClick={() => onSelect(bot.id)}
        {...stylex.props(styles.botButton)}
      >
        <BotAvatar bot={bot} size={36} />
        <span {...stylex.props(styles.text)}>
          <span {...stylex.props(styles.nameLine)}>
            <span {...stylex.props(styles.name)}>{bot.name}</span>
            {bot.isChief && <Crown size={14} strokeWidth={2.25} aria-label="Chief of staff" {...stylex.props(styles.crown)} />}
            {bot.lastActive && <span {...stylex.props(styles.time)}>{bot.lastActive}</span>}
          </span>
          <span {...stylex.props(styles.preview)}>{bot.messages.at(-1)?.text ?? "No messages"}</span>
        </span>
      </button>
      <span {...stylex.props(styles.rowActions)}>
        {children}
        <span aria-label="More" title="More" {...stylex.props(styles.rowAction)}>
          <MoreHorizontal size={16} />
        </span>
      </span>
    </div>
  );
}

const styles = stylex.create({
  sidebar: {
    display: "flex",
    position: "relative",
    flexDirection: "column",
    flexShrink: 0,
    width: 320,
    minHeight: 0,
    borderInlineEndWidth: 1,
    borderInlineEndStyle: "solid",
    borderInlineEndColor: "var(--color-border)",
    color: "var(--color-text-primary)",
    backgroundColor: "var(--color-background-body)",
  },
  tint: {
    position: "absolute",
    insetInline: 0,
    top: 0,
    height: 200,
    opacity: 0.6,
    filter: "blur(24px)",
    pointerEvents: "none",
    maskImage: "linear-gradient(to bottom, black, transparent)",
  },
  top: {
    display: "flex",
    position: "relative",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 12,
    height: 52,
    paddingInline: 12,
  },
  place: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    height: 28,
    paddingBlock: 0,
    paddingInline: 8,
    borderWidth: 0,
    borderRadius: 8,
    color: "inherit",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    backgroundColor: {
      default: "transparent",
      ":hover": "var(--color-overlay-hover)",
    },
  },
  small: {
    width: 28,
    height: 28,
  },
  search: {
    position: "relative",
    marginInline: 8,
    paddingInline: 12,
    borderRadius: 9999,
    backgroundColor: "var(--color-background-surface)",
  },
  scroll: {
    display: "flex",
    position: "relative",
    flexDirection: "column",
    flexGrow: 1,
    gap: 2,
    minHeight: 0,
    paddingTop: 12,
    paddingInline: 8,
    overflowY: "auto",
  },
  row: {
    display: "flex",
    flexShrink: 0,
    alignItems: "center",
    width: "100%",
    paddingBlock: 0,
    borderWidth: 0,
    borderRadius: 8,
    color: "inherit",
    textAlign: "start",
    cursor: "pointer",
    backgroundColor: {
      default: "transparent",
      ":hover": "var(--color-overlay-hover)",
    },
  },
  inbox: {
    gap: 12,
    height: 48,
    paddingInline: 8,
    fontSize: 15,
    fontWeight: 600,
  },
  inboxIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 32,
    height: 32,
    borderRadius: "50%",
    backgroundColor: "var(--color-overlay-pressed)",
  },
  groupLabel: {
    display: "flex",
    flexShrink: 0,
    alignItems: "center",
    gap: 6,
    height: 28,
    marginTop: 4,
    paddingBlock: 0,
    paddingInline: 10,
    borderWidth: 0,
    color: "var(--color-text-secondary)",
    fontSize: 12,
    fontWeight: 500,
    cursor: "pointer",
    backgroundColor: "transparent",
  },
  closed: {
    transform: "rotate(-90deg)",
  },
  botRow: {
    display: "flex",
    position: "relative",
    flexShrink: 0,
    alignItems: "center",
    height: 56,
    borderRadius: 8,
    backgroundColor: {
      default: "transparent",
      ":hover": "var(--color-overlay-hover)",
    },
  },
  selected: {
    backgroundColor: "var(--color-overlay-pressed)",
  },
  botButton: {
    display: "flex",
    flexGrow: 1,
    alignItems: "center",
    gap: 10,
    minWidth: 0,
    height: "100%",
    paddingBlock: 0,
    paddingInline: 10,
    borderWidth: 0,
    borderRadius: 8,
    color: "inherit",
    textAlign: "start",
    cursor: "pointer",
    backgroundColor: "transparent",
    outline: {
      default: "none",
      ":focus-visible": "2px solid var(--color-accent)",
    },
    outlineOffset: -2,
  },
  text: {
    display: "flex",
    flexDirection: "column",
    flexGrow: 1,
    minWidth: 0,
  },
  nameLine: {
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  name: {
    overflow: "hidden",
    fontSize: 15,
    fontWeight: 600,
    lineHeight: "20px",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
  },
  crown: {
    flexShrink: 0,
    color: "#2f6fed",
  },
  time: {
    flexShrink: 0,
    marginInlineStart: "auto",
    color: "var(--color-text-secondary)",
    fontSize: 12,
  },
  preview: {
    overflow: "hidden",
    color: "var(--color-text-secondary)",
    fontSize: 13,
    lineHeight: "18px",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
  },
  rowActions: {
    display: "flex",
    flexShrink: 0,
    alignItems: "center",
    gap: 2,
    paddingInlineEnd: 6,
  },
  rowAction: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 26,
    height: 26,
    borderRadius: 6,
    color: "var(--color-text-secondary)",
    cursor: "pointer",
    backgroundColor: {
      default: "transparent",
      ":hover": "var(--color-overlay-pressed)",
    },
  },
  tools: {
    display: "flex",
    position: "relative",
    flexDirection: "column",
    flexShrink: 0,
    gap: 2,
    paddingInline: 8,
  },
  tool: {
    gap: 12,
    height: 38,
    paddingInline: 10,
    fontSize: 14,
    fontWeight: 500,
  },
  footer: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    paddingTop: 8,
    paddingBottom: 12,
    paddingInline: 12,
  },
});
