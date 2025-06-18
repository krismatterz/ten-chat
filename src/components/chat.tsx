"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { useChat } from "@ai-sdk/react";
import { Send, User, Bot, Paperclip, Plus } from "lucide-react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { cn, formatTimestamp, generateChatTitle } from "~/lib/utils";
import { FileUpload } from "./file-upload";
import { AIProviderSelector } from "./ai-provider-selector";
import { Button } from "./ui/button";
import { AI_PROVIDERS, type ProviderType } from "~/lib/providers";

interface FileAttachment {
  name: string;
  url: string;
  type: string;
  size: number;
}

interface ChatProps {
  chatId: string;
}

export function Chat({ chatId }: ChatProps) {
  const [isFirstMessage, setIsFirstMessage] = useState(true);
  const [selectedProvider, setSelectedProvider] =
    useState<ProviderType>("anthropic");
  const [selectedModel, setSelectedModel] = useState<string>(
    "claude-3-5-sonnet-20241022"
  );
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Convex hooks
  const createConversation = useMutation(api.conversations.create);
  const addMessage = useMutation(api.messages.add);
  const addReaction = useMutation(api.messages.addReaction);

  // Convert chatId to Convex ID type if it exists as a conversation
  const [conversationId, setConversationId] =
    useState<Id<"conversations"> | null>(null);

  // Query messages only if we have a valid conversation ID
  const messagesData = useQuery(
    api.messages.list,
    conversationId ? { conversationId } : "skip"
  );

  // AI Chat hook for streaming (AI SDK v4 stable)
  const {
    messages: aiMessages,
    input,
    handleInputChange,
    handleSubmit: aiHandleSubmit,
    isLoading,
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
        // Extract text content from message
        const textContent = message.content || "";

        await addMessage({
          conversationId,
          role: "assistant",
          content: textContent,
          model: selectedModel,
          provider: selectedProvider,
        });
      }
    },
    onError: (error) => {
      console.error("Chat error:", error);
    },
  });

  // Use loading state from AI SDK v4
  const aiIsLoading = isLoading;

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Sync Convex messages with AI messages (AI SDK v4)
  useEffect(() => {
    if (messagesData && messagesData.length > 0) {
      const formattedMessages = messagesData.map((msg) => ({
        id: msg._id,
        role: msg.role as "user" | "assistant",
        content: msg.content,
        // Include attachments for API processing
        attachments: msg.attachments,
      }));
      setAiMessages(formattedMessages);
    }
  }, [messagesData]); // Remove setAiMessages from dependencies to prevent infinite loop

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && attachments.length === 0) return;

    try {
      let convId = conversationId;

      // Create conversation if it doesn't exist
      if (!convId) {
        const title = generateChatTitle(input || "File upload");
        convId = await createConversation({
          title,
          model: selectedModel,
          provider: selectedProvider,
        });
        setConversationId(convId);
        setIsFirstMessage(false);
      }

      // Create user message with attachments for AI
      const userMessage = {
        id: `temp-${Date.now()}`, // Temporary ID
        role: "user" as const,
        content: input || (attachments.length > 0 ? "Shared files" : ""),
        attachments: attachments.length > 0 ? attachments : undefined,
      };

      // Add user message to AI messages immediately
      setAiMessages((prev) => [...prev, userMessage]);

      // Save user message to Convex with attachments
      await addMessage({
        conversationId: convId,
        role: "user",
        content: input || (attachments.length > 0 ? "Shared files" : ""),
        attachments: attachments.length > 0 ? attachments : undefined,
      });

      // Clear input and attachments
      setAttachments([]);
      setShowUpload(false);

      // For AI SDK, we need to trigger the chat with the current messages
      // Since we're using attachments, we'll trigger a manual API call
      if (input.trim() || attachments.length > 0) {
        aiHandleSubmit(e);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const currentProvider = AI_PROVIDERS.find((p) => p.id === selectedProvider);

  const handleFilesUploaded = (files: FileAttachment[]) => {
    console.log("📎 Files uploaded to chat:", files);
    setAttachments((prev) => {
      const newAttachments = [...prev, ...files];
      console.log("📋 Updated attachments:", newAttachments);
      return newAttachments;
    });
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    try {
      await addReaction({ messageId: messageId as any, emoji });
    } catch (error) {
      console.error("Failed to add reaction:", error);
    }
  };

  const handleProviderChange = (provider: string, model: string) => {
    setSelectedProvider(provider as ProviderType);
    setSelectedModel(model);
  };

  const popularEmojis = ["👍", "❤️", "😊", "😮", "😢", "😡"];

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="mx-auto max-w-3xl space-y-4">
          {aiMessages.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <Bot className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 font-semibold text-foreground">
                  Start a conversation
                </h3>
                <p className="mt-2 text-muted-foreground">
                  Type a message below to begin chatting with{" "}
                  {currentProvider?.name} AI.
                </p>
                <div className="mt-4 flex items-center justify-center gap-2 text-muted-foreground text-sm">
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
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Bot className="h-4 w-4" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg px-4 py-2",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-card-foreground shadow-sm border"
                  )}
                >
                  {/* Render message content (AI SDK v4) */}
                  <div className="whitespace-pre-wrap">{msg.content}</div>

                  {/* Display attachments if they exist */}
                  {messagesData?.find((m) => m._id === msg.id)?.attachments && (
                    <div className="mt-2 space-y-1">
                      {messagesData
                        .find((m) => m._id === msg.id)
                        ?.attachments?.map((attachment) => (
                          <div
                            key={attachment.url}
                            className={cn(
                              "flex items-center gap-2 text-xs rounded p-2",
                              msg.role === "user" ? "bg-primary/20" : "bg-muted"
                            )}
                          >
                            <span>📎</span>
                            <a
                              href={attachment.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="truncate hover:underline"
                            >
                              {attachment.name}
                            </a>
                          </div>
                        ))}
                    </div>
                  )}

                  {/* Display reactions */}
                  {(() => {
                    const messageData = messagesData?.find(
                      (m) => m._id === msg.id
                    );
                    const reactions = messageData?.reactions || [];

                    if (
                      reactions.length === 0 &&
                      !msg.id?.startsWith("temp-")
                    ) {
                      return null;
                    }

                    // Group reactions by emoji
                    const reactionGroups = reactions.reduce(
                      (acc, reaction) => {
                        if (!acc[reaction.emoji]) {
                          acc[reaction.emoji] = [];
                        }
                        acc[reaction.emoji].push(reaction);
                        return acc;
                      },
                      {} as Record<string, typeof reactions>
                    );

                    return (
                      <div className="mt-2 flex items-center gap-1 flex-wrap">
                        {/* Existing reactions */}
                        {Object.entries(reactionGroups).map(
                          ([emoji, reactionList]) => (
                            <button
                              key={emoji}
                              onClick={() => handleReaction(msg.id, emoji)}
                              className={cn(
                                "group flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-colors",
                                msg.role === "user"
                                  ? "bg-primary/20 hover:bg-primary/30"
                                  : "bg-muted hover:bg-muted/80"
                              )}
                            >
                              <span>{emoji}</span>
                              <span className="text-xs">
                                {reactionList.length}
                              </span>
                            </button>
                          )
                        )}

                        {/* Add reaction button (only for non-temporary messages) */}
                        {!msg.id?.startsWith("temp-") && (
                          <div className="group relative">
                            <button
                              className={cn(
                                "opacity-0 group-hover:opacity-100 flex items-center justify-center w-6 h-6 rounded-full transition-all",
                                msg.role === "user"
                                  ? "bg-primary/20 hover:bg-primary/30"
                                  : "bg-muted hover:bg-muted/80"
                              )}
                              title="Add reaction"
                            >
                              <Plus className="h-3 w-3" />
                            </button>

                            {/* Reaction picker (simplified) */}
                            <div className="absolute bottom-full left-0 mb-2 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity">
                              <div className="flex gap-1 p-2 bg-card rounded-lg shadow-lg border">
                                {popularEmojis.map((emoji) => (
                                  <button
                                    key={emoji}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleReaction(msg.id, emoji);
                                    }}
                                    className="w-8 h-8 flex items-center justify-center rounded hover:bg-muted transition-colors"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  <div className="mt-1 flex items-center justify-between">
                    <p
                      className={cn(
                        "text-xs",
                        msg.role === "user"
                          ? "text-primary-foreground/70"
                          : "text-muted-foreground"
                      )}
                    >
                      {formatTimestamp(Date.now())}
                    </p>
                    {msg.role === "assistant" && (
                      <span className="text-muted-foreground text-xs">
                        {selectedProvider}
                      </span>
                    )}
                  </div>
                </div>
                {msg.role === "user" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))
          )}

          {/* Loading indicator */}
          {aiIsLoading && (
            <div className="flex justify-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Bot className="h-4 w-4" />
              </div>
              <div className="max-w-[80%] rounded-lg bg-card px-4 py-2 text-card-foreground shadow-sm border">
                <div className="flex items-center gap-2">
                  <div className="animate-pulse">Thinking...</div>
                  <div className="flex gap-1">
                    <div className="h-1 w-1 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
                    <div className="h-1 w-1 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
                    <div className="h-1 w-1 animate-bounce rounded-full bg-muted-foreground" />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t px-6 py-4 bg-background/50 backdrop-blur-sm">
        <div className="mx-auto max-w-3xl space-y-3">
          {/* File Upload Dropdown */}
          {showUpload && (
            <div className="border rounded-lg p-4 bg-card">
              <FileUpload
                onFilesUploaded={handleFilesUploaded}
                attachments={attachments}
                onRemoveAttachment={handleRemoveAttachment}
                disabled={aiIsLoading}
              />
            </div>
          )}

          {/* Input Area */}
          <form onSubmit={handleSendMessage} className="space-y-3">
            <div className="relative flex gap-2">
              <div className="flex-1 relative">
                <textarea
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                  placeholder={`Ask ${currentProvider?.name} ${selectedModel.split("-").slice(-1)[0] || selectedModel} anything...`}
                  className="w-full resize-none rounded-lg border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                  rows={1}
                  disabled={aiIsLoading}
                />
              </div>

              {/* Attach Button */}
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowUpload(!showUpload)}
                className="px-4 h-auto py-3 gap-2"
                disabled={aiIsLoading}
              >
                <Paperclip className="h-4 w-4" />
                <span className="text-sm">Attach</span>
              </Button>

              {/* Send Button */}
              <Button
                type="submit"
                disabled={
                  (!input.trim() && attachments.length === 0) || aiIsLoading
                }
                className="px-4 h-auto py-3"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>

            {/* AI Provider Selector */}
            <div className="flex items-center justify-between">
              <AIProviderSelector
                selectedProvider={selectedProvider}
                selectedModel={selectedModel}
                onProviderChange={handleProviderChange}
              />
              {attachments.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {attachments.length} file{attachments.length > 1 ? "s" : ""}{" "}
                  attached
                </span>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
