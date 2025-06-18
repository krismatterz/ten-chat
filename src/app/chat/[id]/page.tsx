"use client";

import { use, useEffect } from "react";
import { Chat } from "~/components/chat";
import { SidebarTrigger } from "~/components/ui/sidebar";
import { useChatContext } from "~/components/chat-context";

interface ChatPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function ChatPage({ params }: ChatPageProps) {
  const { id } = use(params);
  const { setCurrentChatId } = useChatContext();

  useEffect(() => {
    setCurrentChatId(id);
    return () => setCurrentChatId(null);
  }, [id, setCurrentChatId]);

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center gap-3 p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <SidebarTrigger className="shrink-0" />
      </header>
      <main className="flex-1 overflow-hidden">
        <Chat chatId={id} />
      </main>
    </div>
  );
}
