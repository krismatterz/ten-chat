"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface ChatContextType {
  currentChatId: string | null;
  setCurrentChatId: (id: string | null) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  return (
    <ChatContext.Provider value={{ currentChatId, setCurrentChatId }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }
  return context;
}
