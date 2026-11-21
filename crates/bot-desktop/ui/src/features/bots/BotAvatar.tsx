import * as stylex from "@stylexjs/stylex";
import type { Bot } from "./types";

interface BotAvatarProps {
  bot: Pick<Bot, "name" | "color">;
  size: number;
}

export function BotAvatar({ bot, size }: BotAvatarProps) {
  return (
    <span
      aria-hidden="true"
      {...stylex.props(styles.avatar)}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.45), backgroundColor: bot.color }}
    >
      {bot.name.charAt(0)}
    </span>
  );
}

const styles = stylex.create({
  avatar: {
    display: "flex",
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "32%",
    color: "var(--color-on-dark)",
    fontWeight: 600,
    lineHeight: 1,
  },
});
