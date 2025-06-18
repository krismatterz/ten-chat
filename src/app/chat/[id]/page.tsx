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
      <div className="flex items-center gap-2 p-4 border-b">
        <SidebarTrigger />
        <h1 className="font-semibold">Ten Chat</h1>
      </div>
      <Chat chatId={id} />
    </div>
  );
}
