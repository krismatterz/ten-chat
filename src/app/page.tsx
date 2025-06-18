"use client";

import { Chat } from "~/components/chat";
import { SidebarTrigger } from "~/components/ui/sidebar";

export default function HomePage() {
  return (
    <div className="flex h-screen flex-col">
      <div className="flex items-center gap-2 p-4 border-b">
        <SidebarTrigger />
        <h1 className="font-semibold">Ten Chat</h1>
      </div>
      <Chat chatId="new" />
    </div>
  );
}
