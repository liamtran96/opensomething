import { defineTheme } from "@astryxdesign/core/theme";
import { neutralTheme } from "@astryxdesign/theme-neutral";

export const brandTheme = defineTheme({
  name: "brand",
  extends: neutralTheme,
  radius: { base: 4, multiplier: 0.5 },
});
