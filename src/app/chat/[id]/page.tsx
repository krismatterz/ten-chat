"use client";

import { use, useEffect } from "react";
import { Chat } from "~/components/chat";
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
  }, [id, setCurrentChatId]); // Include setCurrentChatId to fix linter warning

  return (
    <div className="flex h-screen flex-col">
      <main className="flex-1 overflow-hidden">
        <Chat chatId={id} />
      </main>
    </div>
  );
}
