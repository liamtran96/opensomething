import { Theme } from "@astryxdesign/core/theme";
import { type BackdropId, backdropStyles, backdrops } from "../features/backdrop/backdrops";
import type { Bot } from "../features/bots/types";
import { ChatHeader } from "../features/chat/ChatHeader";
import { ChatPane } from "../features/chat/ChatPane";
import type { MessageKind } from "../features/chat/types";
import { SettingsDialog } from "../features/settings/SettingsDialog";
import { AccountMenu } from "../features/sidebar/AccountMenu";
import { Sidebar } from "../features/sidebar/Sidebar";
import { mockBots } from "../mocks/bots";
import { brandTheme } from "../themes/built/brand";
import * as stylex from "@stylexjs/stylex";
import { useEffect, useState } from "react";

export function App() {
  const [bots, setBots] = useState<Bot[]>(mockBots);
  const [selectedId, setSelectedId] = useState(mockBots[0].id);
  const [backdrop, setBackdrop] = useState<BackdropId>("dawn");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const selected = bots.find((bot) => bot.id === selectedId) ?? mockBots[0];

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.ctrlKey && event.key === ",") setSettingsOpen(true);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function addMessage(botId: string, kind: MessageKind, text: string) {
    setBots((current) =>
      current.map((bot) =>
        bot.id === botId ? { ...bot, messages: [...bot.messages, { id: bot.messages.length, kind, text }] } : bot,
      ),
    );
  }

  return (
    <Theme theme={brandTheme} mode={backdrops[backdrop].mode}>
      <div {...stylex.props(styles.window)}>
        {sidebarOpen && (
          <Sidebar
            bots={bots}
            selectedId={selected.id}
            onSelect={setSelectedId}
            picture={backdropStyles[backdrop]}
            account={<AccountMenu onOpenSettings={() => setSettingsOpen(true)} />}
          />
        )}
        <main {...stylex.props(styles.main)}>
          <ChatHeader bot={selected} isSidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen((open) => !open)} />
          <ChatPane key={selected.id} bot={selected} onAdd={(kind, text) => addMessage(selected.id, kind, text)} />
        </main>
        <SettingsDialog
          isOpen={settingsOpen}
          onOpenChange={setSettingsOpen}
          botCount={bots.length}
          backdrop={backdrop}
          onBackdropChange={setBackdrop}
        />
      </div>
    </Theme>
  );
}

const styles = stylex.create({
  window: {
    display: "flex",
    height: "100%",
    overflow: "hidden",
    backgroundColor: "var(--color-background-surface)",
  },
  main: {
    display: "flex",
    flexDirection: "column",
    flexGrow: 1,
    minWidth: 0,
    minHeight: 0,
  },
});
