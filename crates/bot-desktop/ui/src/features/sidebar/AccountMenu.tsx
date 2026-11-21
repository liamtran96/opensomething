import { DropdownMenu } from "@astryxdesign/core/DropdownMenu";
import * as stylex from "@stylexjs/stylex";
import { ChevronRight, CreditCard, LifeBuoy, Megaphone, Settings, Smartphone } from "lucide-react";

interface AccountMenuProps {
  onOpenSettings: () => void;
}

export function AccountMenu({ onOpenSettings }: AccountMenuProps) {
  return (
    <DropdownMenu
      placement="above"
      alignment="start"
      menuWidth={272}
      menuMaxHeight={420}
      items={[
        {
          icon: <span {...stylex.props(styles.badge)}>?</span>,
          label: "You",
          description: "Not signed in",
          endContent: <ChevronRight size={14} aria-hidden="true" />,
        },
        { type: "divider" },
        { icon: <Smartphone size={16} />, label: "Phone & devices", description: "Not set up on This computer" },
        {
          icon: <Settings size={16} />,
          label: "Settings",
          endContent: <span {...stylex.props(styles.shortcut)}>Ctrl+,</span>,
          onClick: onOpenSettings,
        },
        { icon: <CreditCard size={16} />, label: "Plan & billing", description: "Free" },
        { type: "divider" },
        { icon: <Megaphone size={16} />, label: "Announcements" },
        { icon: <LifeBuoy size={16} />, label: "Help", endContent: <ChevronRight size={14} aria-hidden="true" /> },
      ]}
      renderTrigger={(trigger) => (
        <button type="button" {...trigger} {...stylex.props(styles.account)}>
          <span {...stylex.props(styles.badge)}>?</span>
          You
        </button>
      )}
    />
  );
}

const styles = stylex.create({
  account: {
    display: "flex",
    flexGrow: 1,
    alignItems: "center",
    gap: 10,
    height: 40,
    paddingBlock: 0,
    paddingInline: 6,
    borderWidth: 0,
    borderRadius: 8,
    color: "var(--color-text-primary)",
    fontSize: 14,
    fontWeight: 500,
    textAlign: "start",
    cursor: "pointer",
    backgroundColor: {
      default: "transparent",
      ":hover": "var(--color-overlay-hover)",
      ":is([aria-expanded=true])": "var(--color-overlay-pressed)",
    },
  },
  badge: {
    display: "flex",
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    width: 28,
    height: 28,
    borderRadius: "50%",
    color: "var(--color-text-secondary)",
    fontSize: 12,
    fontWeight: 500,
    backgroundColor: "var(--color-overlay-pressed)",
  },
  shortcut: {
    color: "var(--color-text-secondary)",
    fontSize: 12,
  },
});
