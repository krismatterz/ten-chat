"use client";

import { Chat } from "~/components/chat";

export default function HomePage() {
  return (
    <div className="flex h-screen flex-col dia-gradient">
      <main className="flex-1 overflow-hidden relative">
        <div className="gradient-orb-1" />
        <div className="gradient-orb-2" />
        <Chat chatId="new" />
      </main>
    </div>
  );
}
