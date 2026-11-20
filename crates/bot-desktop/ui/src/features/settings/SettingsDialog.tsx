import { Dialog } from "@astryxdesign/core/Dialog";
import { Switch } from "@astryxdesign/core/Switch";
import { TextInput } from "@astryxdesign/core/TextInput";
import * as stylex from "@stylexjs/stylex";
import {
  Archive,
  ArrowLeftRight,
  Bot as BotIcon,
  ChevronRight,
  Coins,
  CreditCard,
  Laptop,
  LockKeyhole,
  type LucideIcon,
  Monitor,
  Search,
  Smartphone,
  Sparkles,
  X,
} from "lucide-react";
import { type ReactNode, useState } from "react";
import { BackdropPicker } from "../backdrop/BackdropPicker";
import type { BackdropId } from "../backdrop/backdrops";

interface Page {
  id: string;
  label: string;
  icon?: LucideIcon;
  /** A second line makes the item a tall item with a badge. */
  line?: string;
  badge?: ReactNode;
}

const pageGroups = (botCount: number): Page[][] => [
  [
    { id: "computer", label: "This computer", line: `${botCount} bots`, badge: <Laptop size={15} /> },
    { id: "devices", label: "Phone & devices", icon: Smartphone },
    { id: "ai", label: "AI", icon: Sparkles },
    { id: "bots", label: "You and your bots", icon: BotIcon },
    { id: "desktops", label: "Desktops & browser", icon: Monitor },
    { id: "vault", label: "Vault", icon: LockKeyhole },
    { id: "spending", label: "Spending", icon: Coins },
    { id: "transfer", label: "Import & export", icon: ArrowLeftRight },
    { id: "data", label: "Data", icon: Archive },
  ],
  [
    { id: "account", label: "Your account", line: "Not signed in", badge: "?" },
    { id: "billing", label: "Plan & billing", icon: CreditCard },
  ],
  [{ id: "app", label: "This app", line: "0.1.0 · Up to date", badge: "o" }],
];

interface SettingsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  botCount: number;
  backdrop: BackdropId;
  onBackdropChange: (id: BackdropId) => void;
}

export function SettingsDialog({ isOpen, onOpenChange, botCount, backdrop, onBackdropChange }: SettingsDialogProps) {
  const [pageId, setPageId] = useState("computer");
  const [query, setQuery] = useState("");
  const [advanced, setAdvanced] = useState(true);
  const [address, setAddress] = useState("");
  const [model, setModel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const groups = pageGroups(botCount);
  const page = groups.flat().find(({ id }) => id === pageId);
  const matches = (item: Page) => item.label.toLowerCase().includes(query.trim().toLowerCase());

  return (
    <Dialog isOpen={isOpen} onOpenChange={onOpenChange} width={920} padding={0}>
      <div {...stylex.props(styles.body)}>
        <nav aria-label="Settings" {...stylex.props(styles.nav)}>
          <label {...stylex.props(styles.search)}>
            <Search size={14} aria-hidden="true" />
            <input
              aria-label="Search settings"
              placeholder="Search settings"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              {...stylex.props(styles.searchInput)}
            />
            <kbd {...stylex.props(styles.kbd)}>/</kbd>
          </label>
          <div {...stylex.props(styles.navList)}>
            {groups.map((group) => (
              <div key={group[0]?.id} {...stylex.props(styles.navGroup)}>
                {group.filter(matches).map(({ id, label, icon: ItemIcon, line, badge }) => (
                  <button
                    key={id}
                    type="button"
                    aria-current={id === pageId ? "page" : undefined}
                    onClick={() => setPageId(id)}
                    {...stylex.props(styles.item, line !== undefined && styles.tall, id === pageId && styles.current)}
                  >
                    <span {...stylex.props(styles.itemIcon, badge !== undefined && styles.badge)}>
                      {ItemIcon ? <ItemIcon size={16} strokeWidth={1.75} aria-hidden="true" /> : badge}
                    </span>
                    <span {...stylex.props(styles.itemText)}>
                      <span {...stylex.props(line !== undefined && styles.strong)}>{label}</span>
                      {line !== undefined && <span {...stylex.props(styles.itemLine)}>{line}</span>}
                    </span>
                  </button>
                ))}
              </div>
            ))}
          </div>
          <div {...stylex.props(styles.navFoot)}>
            <Switch label="Advanced mode" labelPosition="start" value={advanced} onChange={setAdvanced} />
          </div>
        </nav>
        <div {...stylex.props(styles.page)}>
          <button type="button" aria-label="Close" onClick={() => onOpenChange(false)} {...stylex.props(styles.close)}>
            <X size={18} />
          </button>
          <div {...stylex.props(styles.column)}>
            <header {...stylex.props(styles.header)}>
              <h2 {...stylex.props(styles.title)}>{page?.label}</h2>
              {pageId === "computer" && <p {...stylex.props(styles.secondary)}>opensomething 0.1.0 · Updates with the app</p>}
            </header>
            {pageId === "computer" ? (
              <>
                <Group label="At a glance">
                  <Row label="Phone & devices">
                    <Value>Not set up</Value>
                  </Row>
                  <Row label="AI">
                    <Value>Not set up</Value>
                  </Row>
                  <Row label="Apps">
                    <Value>None yet</Value>
                  </Row>
                </Group>
                <Group label="In the sidebar">
                  <Row
                    label="Sidebar picture"
                    description="A picture faded into the top of the sidebar. It also sets the colour mode."
                  >
                    <BackdropPicker value={backdrop} onChange={onBackdropChange} />
                  </Row>
                </Group>
              </>
            ) : pageId === "ai" ? (
              <Group label="Model provider">
                <div {...stylex.props(styles.fields)}>
                  <TextInput
                    label="Provider address"
                    value={address}
                    onChange={setAddress}
                    placeholder="https://openrouter.ai/api/v1"
                  />
                  <TextInput label="Model" value={model} onChange={setModel} />
                  <TextInput label="API key" type="password" value={apiKey} onChange={setApiKey} autoComplete="off" />
                </div>
              </Group>
            ) : (
              <p {...stylex.props(styles.secondary, styles.empty)}>This page has no settings yet.</p>
            )}
          </div>
        </div>
      </div>
    </Dialog>
  );
}

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section {...stylex.props(styles.group)}>
      <h3 {...stylex.props(styles.groupLabel)}>{label}</h3>
      <div {...stylex.props(styles.card)}>{children}</div>
    </section>
  );
}

function Row({ label, description, children }: { label: string; description?: string; children: ReactNode }) {
  return (
    <div {...stylex.props(styles.row)}>
      <div {...stylex.props(styles.rowText)}>
        <div {...stylex.props(styles.rowLabel)}>{label}</div>
        {description && <div {...stylex.props(styles.secondary)}>{description}</div>}
      </div>
      {children}
    </div>
  );
}

function Value({ children }: { children: ReactNode }) {
  return (
    <span {...stylex.props(styles.value)}>
      {children}
      <ChevronRight size={14} aria-hidden="true" />
    </span>
  );
}

const hover = "color-mix(in srgb, var(--color-text-primary) 5%, transparent)";
const raised = "color-mix(in srgb, var(--color-text-primary) 9%, transparent)";

const styles = stylex.create({
  body: {
    display: "flex",
    height: "min(640px, 80dvh)",
    color: "var(--color-text-primary)",
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
    width: 220,
    minHeight: 0,
    borderInlineEndWidth: 1,
    borderInlineEndStyle: "solid",
    borderInlineEndColor: "var(--color-border)",
  },
  search: {
    display: "flex",
    flexShrink: 0,
    alignItems: "center",
    gap: 8,
    height: 32,
    marginTop: 12,
    marginInline: 12,
    paddingInline: 8,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "var(--color-border)",
    borderRadius: 8,
    color: "var(--color-text-secondary)",
  },
  searchInput: {
    flexGrow: 1,
    minWidth: 0,
    padding: 0,
    borderWidth: 0,
    color: "var(--color-text-primary)",
    fontSize: 13,
    backgroundColor: "transparent",
    outline: "none",
  },
  kbd: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 16,
    height: 16,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "var(--color-border)",
    borderRadius: 4,
    fontFamily: "inherit",
    fontSize: 11,
  },
  navList: {
    display: "flex",
    flexDirection: "column",
    flexGrow: 1,
    gap: 16,
    minHeight: 0,
    padding: 12,
    overflowY: "auto",
  },
  navGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  item: {
    display: "flex",
    flexShrink: 0,
    alignItems: "center",
    gap: 8,
    height: 32,
    paddingBlock: 0,
    paddingInline: 8,
    borderWidth: 0,
    borderRadius: 8,
    color: "inherit",
    fontSize: 13,
    textAlign: "start",
    cursor: "pointer",
    backgroundColor: {
      default: "transparent",
      ":hover": hover,
    },
    outline: {
      default: "none",
      ":focus-visible": "2px solid var(--color-accent)",
    },
    outlineOffset: -2,
  },
  tall: {
    height: 44,
  },
  current: {
    fontWeight: 500,
    backgroundColor: raised,
  },
  itemIcon: {
    display: "flex",
    flexShrink: 0,
    justifyContent: "center",
    width: 24,
    color: "var(--color-text-secondary)",
  },
  badge: {
    alignItems: "center",
    height: 24,
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
    backgroundColor: raised,
  },
  itemText: {
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
  },
  strong: {
    fontSize: 14,
    fontWeight: 500,
    lineHeight: "18px",
  },
  itemLine: {
    color: "var(--color-text-secondary)",
    fontSize: 12,
    fontWeight: 400,
    lineHeight: "16px",
  },
  navFoot: {
    flexShrink: 0,
    paddingBlock: 12,
    paddingInline: 16,
    borderTopWidth: 1,
    borderTopStyle: "solid",
    borderTopColor: "var(--color-border)",
  },
  page: {
    position: "relative",
    flexGrow: 1,
    minWidth: 0,
    paddingBottom: 48,
    paddingInlineStart: 32,
    paddingInlineEnd: 64,
    overflowY: "auto",
  },
  close: {
    display: "flex",
    position: "absolute",
    top: 12,
    insetInlineEnd: 12,
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
      ":hover": hover,
    },
  },
  column: {
    display: "flex",
    flexDirection: "column",
    gap: 24,
    maxWidth: 640,
  },
  header: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    paddingTop: 16,
    paddingInlineStart: 16,
  },
  title: {
    margin: 0,
    fontSize: 18,
    fontWeight: 600,
    lineHeight: "24px",
  },
  secondary: {
    margin: 0,
    color: "var(--color-text-secondary)",
    fontSize: 13,
    lineHeight: "18px",
  },
  empty: {
    paddingInlineStart: 16,
  },
  group: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  groupLabel: {
    margin: 0,
    paddingInline: 16,
    fontSize: 13,
    fontWeight: 500,
    lineHeight: "28px",
  },
  card: {
    display: "flex",
    flexDirection: "column",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "var(--color-border)",
    borderRadius: 12,
  },
  fields: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    padding: 16,
  },
  row: {
    display: "flex",
    alignItems: "center",
    gap: 24,
    minHeight: 44,
    paddingBlock: 12,
    paddingInline: 16,
    borderTopWidth: {
      default: 1,
      ":first-child": 0,
    },
    borderTopStyle: "solid",
    borderTopColor: "var(--color-border)",
  },
  rowText: {
    flexGrow: 1,
    minWidth: 0,
  },
  rowLabel: {
    fontSize: 14,
    lineHeight: "20px",
  },
  value: {
    display: "flex",
    flexShrink: 0,
    alignItems: "center",
    gap: 6,
    color: "var(--color-text-secondary)",
    fontSize: 13,
  },
});
