import type { Metadata } from "next";
import { Geist, JetBrains_Mono } from "next/font/google";
import { Provider } from "@/components/provider";
import { appName } from "@/lib/shared";
import "./global.css";

export const metadata: Metadata = {
  title: { default: appName, template: `%s | ${appName}` },
  description: "A local-first desktop application for running a team of AI bots.",
};

const sans = Geist({ variable: "--font-sans", subsets: ["latin"] });
const mono = JetBrains_Mono({ variable: "--font-mono", subsets: ["latin"] });

export default function Layout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
