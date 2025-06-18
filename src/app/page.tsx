"use client";

import { Chat } from "~/components/chat";
import { SidebarTrigger } from "~/components/ui/sidebar";

export default function HomePage() {
  return (
    <div className="flex h-screen flex-col dia-gradient">
      <header className="flex items-center gap-3 p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 modern-gradient">
        <SidebarTrigger className="shrink-0" />
        <div className="flex items-center gap-2">
          <h1 className="font-semibold text-foreground">Ten Chat</h1>
          <span className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded-md">
            AI-Powered Chat
          </span>
        </div>
      </header>
      <main className="flex-1 overflow-hidden relative">
        <div className="gradient-orb-1" />
        <div className="gradient-orb-2" />
        <Chat chatId="new" />
      </main>
    </div>
  );
}
