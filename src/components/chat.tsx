"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { useChat } from "ai/react";
import { Send, User, Bot, Settings, Zap } from "lucide-react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { cn, formatTimestamp, generateChatTitle } from "~/lib/utils";

interface ChatProps {
  chatId: string;
}

export function Chat({ chatId }: ChatProps) {
  const [isFirstMessage, setIsFirstMessage] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<
    "anthropic" | "openai" | "groq"
  >("anthropic");
  const [selectedModel, setSelectedModel] = useState<string>(
    "claude-3-5-sonnet-20241022"
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Convex hooks
  const createConversation = useMutation(api.conversations.create);
  const addMessage = useMutation(api.messages.add);

  // Convert chatId to Convex ID type if it exists as a conversation
  const [conversationId, setConversationId] =
    useState<Id<"conversations"> | null>(null);

  // Query messages only if we have a valid conversation ID
  const messagesData = useQuery(
    api.messages.list,
    conversationId ? { conversationId } : "skip"
  );

  // AI Chat hook for streaming
  const {
    messages: aiMessages,
    input,
    handleInputChange,
    handleSubmit: aiHandleSubmit,
    isLoading: aiIsLoading,
    setMessages: setAiMessages,
  } = useChat({
    api: "/api/chat",
    body: {
      provider: selectedProvider,
      model: selectedModel,
    },
    onFinish: async (message) => {
      // Save AI response to Convex
      if (conversationId) {
        await addMessage({
          conversationId,
          role: "assistant",
          content: message.content,
          model: selectedModel,
          provider: selectedProvider,
        });
      }
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesData, aiMessages]);

  // Sync Convex messages with AI messages
  useEffect(() => {
    if (messagesData) {
      const formattedMessages = messagesData.map((msg) => ({
        id: msg._id,
        role: msg.role as "user" | "assistant",
        content: msg.content,
      }));
      setAiMessages(formattedMessages);
    }
  }, [messagesData, setAiMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    try {
      let convId = conversationId;

      // Create conversation if it doesn't exist
      if (!convId) {
        const title = generateChatTitle(input);
        convId = await createConversation({
          title,
          model: selectedModel,
          provider: selectedProvider,
        });
        setConversationId(convId);
        setIsFirstMessage(false);
      }

      // Save user message to Convex
      await addMessage({
        conversationId: convId,
        role: "user",
        content: input,
      });

      // Send to AI
      aiHandleSubmit(e);
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const providers = [
    {
      id: "anthropic" as const,
      name: "Anthropic",
      models: ["claude-3-5-sonnet-20241022", "claude-3-5-haiku-20241022"],
    },
    {
      id: "openai" as const,
      name: "OpenAI",
      models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"],
    },
    {
      id: "groq" as const,
      name: "Groq",
      models: [
        "llama-3.1-8b-instant",
        "llama-3.1-70b-versatile",
        "mixtral-8x7b-32768",
      ],
    },
  ];

  const currentProvider = providers.find((p) => p.id === selectedProvider);

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

        {/* Provider Selection */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-neutral-500" />
            <select
              value={selectedProvider}
              onChange={(e) => {
                const provider = e.target.value as
                  | "anthropic"
                  | "openai"
                  | "groq";
                setSelectedProvider(provider);
                const newProvider = providers.find((p) => p.id === provider);
                if (newProvider && newProvider.models[0]) {
                  setSelectedModel(newProvider.models[0]);
                }
              }}
              className="rounded border border-neutral-300 bg-white px-2 py-1 text-sm dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100"
            >
              {providers.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.name}
                </option>
              ))}
            </select>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="rounded border border-neutral-300 bg-white px-2 py-1 text-sm dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100"
            >
              {currentProvider?.models.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-500">Demo User</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-300 dark:bg-neutral-600">
              <User className="h-4 w-4" />
            </div>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="mx-auto max-w-3xl space-y-4">
          {aiMessages.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <Bot className="mx-auto h-12 w-12 text-neutral-400" />
                <h3 className="mt-4 font-semibold text-neutral-900 dark:text-neutral-100">
                  Start a conversation
                </h3>
                <p className="mt-2 text-neutral-500">
                  Type a message below to begin chatting with{" "}
                  {currentProvider?.name} AI.
                </p>
                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-neutral-400">
                  <Zap className="h-4 w-4" />
                  <span>
                    Powered by {currentProvider?.name} • {selectedModel}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            aiMessages.map((msg, index) => (
              <div
                key={msg.id || index}
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
                  <div className="mt-1 flex items-center justify-between">
                    <p
                      className={cn(
                        "text-xs",
                        msg.role === "user"
                          ? "text-blue-100"
                          : "text-neutral-500"
                      )}
                    >
                      {formatTimestamp(Date.now())}
                    </p>
                    {msg.role === "assistant" && (
                      <span className="text-xs text-neutral-400">
                        {selectedProvider}
                      </span>
                    )}
                  </div>
                </div>
                {msg.role === "user" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-300 dark:bg-neutral-600">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))
          )}

          {/* Loading indicator */}
          {aiIsLoading && (
            <div className="flex gap-3 justify-start">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
                <Bot className="h-4 w-4" />
              </div>
              <div className="bg-white text-neutral-900 shadow-sm dark:bg-neutral-800 dark:text-neutral-100 max-w-[80%] rounded-lg px-4 py-2">
                <div className="flex items-center gap-2">
                  <div className="animate-pulse">Thinking...</div>
                  <div className="flex gap-1">
                    <div className="w-1 h-1 bg-neutral-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-1 h-1 bg-neutral-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-1 h-1 bg-neutral-400 rounded-full animate-bounce"></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-neutral-200 bg-white px-6 py-4 dark:border-neutral-800 dark:bg-neutral-800">
        <div className="mx-auto max-w-3xl">
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <div className="relative flex-1">
              <textarea
                value={input}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
                placeholder={`Ask ${currentProvider?.name} anything...`}
                className="w-full resize-none rounded-lg border border-neutral-300 bg-white px-4 py-3 pr-12 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100"
                rows={1}
                disabled={aiIsLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || aiIsLoading}
                className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-md bg-blue-600 text-white transition-colors hover:bg-blue-700 disabled:bg-neutral-400"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
