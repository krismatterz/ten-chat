"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { Send, Plus, User, Bot } from "lucide-react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { cn, formatTimestamp, generateChatTitle } from "~/lib/utils";

interface ChatProps {
  chatId: string;
}

export function Chat({ chatId }: ChatProps) {
  const { user } = useUser();
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Convex hooks
  const createConversation = useMutation(api.conversations.create);
  const addMessage = useMutation(api.messages.add);
  const upsertUser = useMutation(api.users.upsert);

  // Convert chatId to Convex ID type if it exists as a conversation
  const [conversationId, setConversationId] =
    useState<Id<"conversations"> | null>(null);

  // Query messages only if we have a valid conversation ID
  const messagesData = useQuery(
    api.messages.list,
    conversationId ? { conversationId } : "skip"
  );

  // Initialize user in Convex when component mounts
  useEffect(() => {
    if (user) {
      upsertUser({
        clerkId: user.id,
        email: user.emailAddresses[0]?.emailAddress ?? "",
        name: user.fullName ?? undefined,
        avatar: user.imageUrl ?? undefined,
      });
    }
  }, [user, upsertUser]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesData]);

  const handleSendMessage = async () => {
    if (!message.trim() || !user || isLoading) return;

    setIsLoading(true);
    try {
      let convId = conversationId;

      // Create conversation if it doesn't exist
      if (!convId) {
        const title = generateChatTitle(message);
        convId = await createConversation({
          title,
          model: "gpt-3.5-turbo",
          provider: "openai",
        });
        setConversationId(convId);
      }

      // Add user message
      await addMessage({
        conversationId: convId,
        role: "user",
        content: message,
      });

      setMessage("");

      // TODO: Add AI response generation here
      // For now, add a simple bot response
      setTimeout(async () => {
        await addMessage({
          conversationId: convId!,
          role: "assistant",
          content: "I'm a placeholder response. AI integration coming soon!",
          model: "gpt-3.5-turbo",
          provider: "openai",
        });
      }, 1000);
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-neutral-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-neutral-50 dark:bg-neutral-900">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-6 py-4 dark:border-neutral-800 dark:bg-neutral-800">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white">
            <Bot className="h-4 w-4" />
          </div>
          <h1 className="font-semibold text-neutral-900 dark:text-neutral-100">
            Ten Chat
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-neutral-500">{user.fullName}</span>
          {user.imageUrl && (
            <img
              src={user.imageUrl}
              alt={user.fullName ?? "User"}
              className="h-8 w-8 rounded-full"
            />
          )}
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="mx-auto max-w-3xl space-y-4">
          {messagesData?.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <Bot className="mx-auto h-12 w-12 text-neutral-400" />
                <h3 className="mt-4 font-semibold text-neutral-900 dark:text-neutral-100">
                  Start a conversation
                </h3>
                <p className="mt-2 text-neutral-500">
                  Type a message below to begin chatting with AI.
                </p>
              </div>
            </div>
          ) : (
            messagesData?.map((msg) => (
              <div
                key={msg._id}
                className={cn(
                  "flex gap-3",
                  msg.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {msg.role === "assistant" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
                    <Bot className="h-4 w-4" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg px-4 py-2",
                    msg.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-white text-neutral-900 shadow-sm dark:bg-neutral-800 dark:text-neutral-100"
                  )}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  <p
                    className={cn(
                      "mt-1 text-xs",
                      msg.role === "user" ? "text-blue-100" : "text-neutral-500"
                    )}
                  >
                    {formatTimestamp(msg.timestamp)}
                  </p>
                </div>
                {msg.role === "user" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-300 dark:bg-neutral-600">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-neutral-200 bg-white px-6 py-4 dark:border-neutral-800 dark:bg-neutral-800">
        <div className="mx-auto max-w-3xl">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type your message..."
                className="w-full resize-none rounded-lg border border-neutral-300 bg-white px-4 py-3 pr-12 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100"
                rows={1}
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={!message.trim() || isLoading}
                className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-md bg-blue-600 text-white transition-colors hover:bg-blue-700 disabled:bg-neutral-400"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
