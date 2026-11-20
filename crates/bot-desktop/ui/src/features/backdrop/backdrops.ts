import type { ThemeMode } from "@astryxdesign/core/theme";
import * as stylex from "@stylexjs/stylex";

export const backdropIds = ["meadow", "dusk", "ocean", "dawn", "plain"] as const;

export type BackdropId = (typeof backdropIds)[number];

interface Backdrop {
  label: string;
  /** The colour mode that keeps text readable on this backdrop. */
  mode: ThemeMode;
}

export const backdrops: Record<BackdropId, Backdrop> = {
  meadow: { label: "Meadow", mode: "dark" },
  dusk: { label: "Dusk", mode: "dark" },
  ocean: { label: "Ocean", mode: "dark" },
  dawn: { label: "Dawn", mode: "light" },
  plain: { label: "Plain", mode: "system" },
};

export const backdropStyles = stylex.create({
  meadow: {
    backgroundColor: "#0d1712",
    backgroundImage: `radial-gradient(circle at 10% 12%, #8fc3e6 0%, transparent 36%),
      radial-gradient(circle at 72% 30%, #f47a1f 0%, transparent 20%),
      radial-gradient(circle at 16% 74%, #e8561a 0%, transparent 16%),
      radial-gradient(circle at 88% 88%, #3f7a35 0%, transparent 42%),
      linear-gradient(160deg, #1f3d2b, #0d1712)`,
  },
  dusk: {
    backgroundColor: "#1a1030",
    backgroundImage: `radial-gradient(circle at 80% 14%, #ff9a5a 0%, transparent 34%),
      radial-gradient(circle at 24% 30%, #d9488f 0%, transparent 38%),
      radial-gradient(circle at 60% 90%, #5b3fd6 0%, transparent 46%),
      linear-gradient(200deg, #3a1d5c, #140c26)`,
  },
  ocean: {
    backgroundColor: "#06182b",
    backgroundImage: `radial-gradient(circle at 18% 20%, #2ad4c9 0%, transparent 34%),
      radial-gradient(circle at 84% 36%, #2f7bf0 0%, transparent 40%),
      radial-gradient(circle at 40% 96%, #0b4f8a 0%, transparent 48%),
      linear-gradient(180deg, #0a2a4a, #06182b)`,
  },
  dawn: {
    backgroundColor: "#f6e9df",
    backgroundImage: `radial-gradient(circle at 14% 16%, #ffd1a8 0%, transparent 40%),
      radial-gradient(circle at 86% 24%, #b9dcff 0%, transparent 42%),
      radial-gradient(circle at 54% 92%, #ffc2d6 0%, transparent 46%),
      linear-gradient(180deg, #fdf4ec, #f1e3ee)`,
  },
  plain: {
    backgroundColor: "var(--color-background-body)",
  },
});
