"use client";

import { useChat } from "@ai-sdk/react";
import { useMutation, useQuery } from "convex/react";
import {
  Check,
  Copy,
  Edit2,
  GitBranch,
  Paperclip,
  RotateCcw,
  Send,
  X,
} from "lucide-react";
import { nanoid } from "nanoid";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AI_PROVIDERS, type ProviderType } from "~/lib/providers";
import {
  cn,
  formatModelName,
  formatTimestamp,
  generateChatTitle,
} from "~/lib/utils";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { AIProviderSelector } from "./ai-provider-selector";
import { FileUpload } from "./file-upload";
import { Button } from "./ui/button";
import { SidebarTrigger } from "./ui/sidebar";

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
  const router = useRouter();
  const [isFirstMessage, setIsFirstMessage] = useState(true);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");

  // Load persistent AI preferences from localStorage
  const [selectedProvider, setSelectedProvider] = useState<ProviderType>(() => {
    if (typeof window !== "undefined") {
      return (
        (localStorage.getItem("tenchat-provider") as ProviderType) ||
        "anthropic"
      );
    }
    return "anthropic";
  });

  const [selectedModel, setSelectedModel] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("tenchat-model") || "claude-3.5-sonnet";
    }
    return "claude-3.5-sonnet";
  });

  const [reasoningLevel, setReasoningLevel] = useState<"low" | "mid" | "high">(
    () => {
      if (typeof window !== "undefined") {
        return (
          (localStorage.getItem("tenchat-reasoning") as
            | "low"
            | "mid"
            | "high") || "mid"
        );
      }
      return "mid";
    }
  );
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Convex hooks
  const createConversation = useMutation(api.conversations.create);
  const addMessage = useMutation(api.conversations.addMessage);
  const autoRename = useMutation(api.conversations.autoRename);
  const branchConversation = useMutation(api.conversations.branch);

  // Convert chatId to Convex ID type if it exists as a conversation
  const [conversationId, setConversationId] =
    useState<Id<"conversations"> | null>(
      chatId !== "new" ? (chatId as Id<"conversations">) : null
    );

  // Query conversation with embedded messages only if we have a valid conversation ID
  const conversationData = useQuery(
    api.conversations.get,
    conversationId ? { conversationId } : "skip"
  );

  // Handle case where conversation was deleted
  useEffect(() => {
    if (conversationId && conversationData === undefined) {
      // If we're trying to load a specific conversation but get undefined, it might be deleted
      // Redirect to home after a brief delay
      const timer = setTimeout(() => {
        if (window.location.pathname !== "/") {
          window.location.href = "/";
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [conversationId, conversationData]);

  // AI Chat hook for streaming (AI SDK v4 stable)
  const {
    messages: aiMessages,
    input,
    handleInputChange,
    handleSubmit: aiHandleSubmit,
    isLoading,
    setMessages: setAiMessages,
    reload,
  } = useChat({
    api: "/api/chat",
    body: {
      provider: selectedProvider,
      model: selectedModel,
      reasoning: reasoningLevel,
      // Include current attachments in the request body
      attachments: attachments.length > 0 ? attachments : undefined,
    },
    onFinish: async (message) => {
      console.log("🎯 onFinish called with:", message.id);
      // Save AI response to Convex (user messages are saved in handleSendMessage)
      if (conversationId) {
        try {
          const textContent = message.content || "";

          if (textContent.trim()) {
            await addMessage({
              conversationId,
              role: "assistant",
              content: textContent,
            });
            console.log("✅ AI message saved to Convex");
          }
        } catch (error) {
          console.error("❌ Failed to save AI message to Convex:", error);
        }
      }
    },
    onError: (error) => {
      console.error("💥 Chat API error:", error);
    },
  });

  // Use loading state from AI SDK v4
  const aiIsLoading = isLoading;

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiMessages.length]);

  // Initialize AI messages from Convex only once when conversation loads
  const [hasInitialized, setHasInitialized] = useState(false);

  // Reset initialization when conversation changes
  useEffect(() => {
    setHasInitialized(false);
    setAiMessages([]); // Clear messages when switching conversations
  }, [conversationId, setAiMessages]);

  useEffect(() => {
    // Only sync once when conversation first loads, not continuously
    if (
      conversationData?.messages &&
      conversationData.messages.length > 0 &&
      !hasInitialized
    ) {
      const formattedMessages = conversationData.messages.map((msg) => ({
        id: msg.id,
        role: msg.role as "user" | "assistant",
        content: msg.content,
        // Include attachments for API processing
        attachments: msg.attachments,
      }));

      setAiMessages(formattedMessages);
      setHasInitialized(true);
    }

    // Reset initialization flag when conversation changes
    if (
      !conversationData ||
      !conversationData.messages ||
      conversationData.messages.length === 0
    ) {
      setHasInitialized(false);
    }
  }, [conversationData, hasInitialized, setAiMessages]); // Include all dependencies

  // Direct file upload handler
  const handleDirectFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files) return;

    // Convert FileList to File array and handle upload
    const fileArray = Array.from(files);

    // For now, create mock FileAttachment objects
    // In a real implementation, you'd upload these to your storage service
    const fileAttachments: FileAttachment[] = fileArray.map((file) => ({
      name: file.name,
      url: URL.createObjectURL(file), // Temporary URL for preview
      type: file.type,
      size: file.size,
    }));

    setAttachments((prev) => [...prev, ...fileAttachments]);

    // Clear the input
    event.target.value = "";
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && attachments.length === 0) return;
    if (aiIsLoading) return; // Prevent duplicate submissions

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

        // Update URL to reflect the new conversation
        window.history.pushState({}, "", `/chat/${convId}`);
      }

      // Save user message to Convex with attachments
      const userMessageAttachments =
        attachments.length > 0
          ? attachments.map((att) => ({
              id: nanoid(),
              name: att.name,
              url: att.url,
              type: att.type,
              size: att.size,
            }))
          : undefined;

      await addMessage({
        conversationId: convId,
        role: "user",
        content:
          input ||
          (attachments.length > 0
            ? "I've shared some files with you. Please analyze them."
            : ""),
        attachments: userMessageAttachments,
      });

      // Auto-rename conversation if it's the first meaningful message
      if (input.trim() && input.trim().length > 3) {
        await autoRename({
          conversationId: convId,
          content: input.trim(),
        });
      }

      // Clear input and attachments before AI submission
      setAttachments([]);
      setShowUpload(false);

      // For AI SDK, we need to trigger the chat
      // The attachments will be included via the body.attachments parameter
      if (input.trim() || attachments.length > 0) {
        await aiHandleSubmit(e);
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

  const handleProviderChange = (provider: string, model: string) => {
    console.log("🔄 handleProviderChange called with:", { provider, model });
    console.log("🔄 Previous state:", { selectedProvider, selectedModel });

    setSelectedProvider(provider as ProviderType);
    setSelectedModel(model);
    console.log("🔄 State updated");

    // Save to localStorage for persistence
    if (typeof window !== "undefined") {
      localStorage.setItem("tenchat-provider", provider);
      localStorage.setItem("tenchat-model", model);
      console.log("💾 Saved to localStorage:", { provider, model });
    }
  };

  // Save reasoning level changes to localStorage
  const handleReasoningChange = (level: "low" | "mid" | "high") => {
    setReasoningLevel(level);
    if (typeof window !== "undefined") {
      localStorage.setItem("tenchat-reasoning", level);
    }
  };

  // Message Actions
  const handleCopyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      // Show a temporary success indicator
      const button = document.activeElement as HTMLButtonElement;
      if (button) {
        const originalTitle = button.title;
        button.title = "✅ Copied!";
        button.style.color = "#10b981"; // green-500
        setTimeout(() => {
          button.title = originalTitle;
          button.style.color = "";
        }, 2000);
      }
      console.log("Message copied to clipboard");
    } catch (error) {
      console.error("Failed to copy message:", error);
      // Show error indicator
      const button = document.activeElement as HTMLButtonElement;
      if (button) {
        const originalTitle = button.title;
        button.title = "❌ Failed to copy";
        button.style.color = "#ef4444"; // red-500
        setTimeout(() => {
          button.title = originalTitle;
          button.style.color = "";
        }, 2000);
      }
    }
  };

  const handleEditMessage = (messageId: string, content: string) => {
    setEditingMessageId(messageId);
    setEditingContent(content);
  };

  const handleSaveEdit = async (messageId: string) => {
    if (!editingContent.trim()) return;

    try {
      // Update the message in Convex
      // Note: We'll need to add an update message mutation in Convex
      console.log("Saving edited message:", messageId, editingContent);

      // Update the local AI messages
      setAiMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, content: editingContent } : msg
        )
      );

      // Clear editing state
      setEditingMessageId(null);
      setEditingContent("");

      // Show success notification
      const notification = document.createElement("div");
      notification.textContent = "✅ Message updated!";
      notification.style.cssText =
        "position: fixed; top: 20px; right: 20px; background: #10b981; color: white; padding: 8px 16px; border-radius: 8px; z-index: 9999; font-size: 14px;";
      document.body.appendChild(notification);
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 2000);
    } catch (error) {
      console.error("Failed to save edit:", error);
    }
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingContent("");
  };

  const handleBranchFromMessage = async (messageId: string) => {
    if (!conversationId) return;

    try {
      const branchedId = await branchConversation({
        originalConversationId: conversationId,
        fromMessageId: messageId,
      });

      // Show success notification before navigating
      const notification = document.createElement("div");
      notification.textContent = "🌿 Conversation branched successfully!";
      notification.style.cssText =
        "position: fixed; top: 20px; right: 20px; background: #10b981; color: white; padding: 8px 16px; border-radius: 8px; z-index: 9999; font-size: 14px;";
      document.body.appendChild(notification);
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 3000);

      // Navigate to the new branched conversation
      router.push(`/chat/${branchedId}`);
    } catch (error) {
      console.error("Failed to branch conversation:", error);
      // Show error notification
      const notification = document.createElement("div");
      notification.textContent = "❌ Failed to branch conversation";
      notification.style.cssText =
        "position: fixed; top: 20px; right: 20px; background: #ef4444; color: white; padding: 8px 16px; border-radius: 8px; z-index: 9999; font-size: 14px;";
      document.body.appendChild(notification);
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 3000);
    }
  };

  const handleRetryMessage = async (
    messageIndex: number,
    messageId?: string
  ) => {
    if (aiIsLoading) return; // Can't retry when loading

    console.log("🔄 Retrying message at index:", messageIndex);

    try {
      let lastUserMessage;
      let messagesToKeep;

      // Check if messageIndex is valid
      if (messageIndex >= aiMessages.length) {
        console.error("Invalid message index");
        return;
      }

      const currentMessage = aiMessages[messageIndex];
      if (!currentMessage) {
        console.error("Message not found at index");
        return;
      }

      if (messageId && currentMessage.role === "user") {
        // Retrying a user message - keep all messages before this one
        lastUserMessage = currentMessage;
        messagesToKeep = aiMessages.slice(0, messageIndex);
      } else {
        // Retrying an AI response - get the last user message before it
        if (messageIndex === 0) {
          console.error("Can't retry first message");
          return;
        }
        const previousMessage = aiMessages[messageIndex - 1];
        if (!previousMessage || previousMessage.role !== "user") {
          console.error("No user message found before AI response");
          return;
        }
        lastUserMessage = previousMessage;
        // Keep all messages before the AI response we're retrying
        messagesToKeep = aiMessages.slice(0, messageIndex);
      }

      if (!lastUserMessage) {
        console.error("Could not determine user message for retry");
        return;
      }

      // Update the AI messages to remove everything after the retry point
      setAiMessages(messagesToKeep);

      console.log(
        "🔄 Triggering new AI response with message:",
        lastUserMessage.content
      );

      // Create a synthetic form submission to trigger a new AI response
      const syntheticEvent = {
        preventDefault: () => {},
      } as React.FormEvent;

      // Temporarily set the input to the user message content for the API call
      const previousInput = input;

      // Manually set up the message context for the AI
      const contextMessages = [
        ...messagesToKeep,
        {
          id: lastUserMessage.id,
          role: lastUserMessage.role,
          content: lastUserMessage.content,
        },
      ];

      // Update AI messages with the context including the user message
      setAiMessages(contextMessages);

      // Set the input temporarily for the API call
      handleInputChange({
        target: { value: lastUserMessage.content },
      } as React.ChangeEvent<HTMLTextAreaElement>);

      // Wait a bit for state to update, then submit
      setTimeout(async () => {
        try {
          await aiHandleSubmit(syntheticEvent);
          // Reset input back to what it was
          handleInputChange({
            target: { value: previousInput },
          } as React.ChangeEvent<HTMLTextAreaElement>);
        } catch (error) {
          console.error("Failed to resubmit:", error);
          // Reset input back to what it was
          handleInputChange({
            target: { value: previousInput },
          } as React.ChangeEvent<HTMLTextAreaElement>);
        }
      }, 100);

      console.log("✅ Message retry initiated successfully");

      // Show success notification
      const notification = document.createElement("div");
      notification.textContent = "🔄 Retrying message...";
      notification.style.cssText =
        "position: fixed; top: 20px; right: 20px; background: #10b981; color: white; padding: 8px 16px; border-radius: 8px; z-index: 9999; font-size: 14px;";
      document.body.appendChild(notification);
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 2000);
    } catch (error) {
      console.error("❌ Failed to retry message:", error);
      // Show user-friendly error
      const notification = document.createElement("div");
      notification.textContent =
        "❌ Failed to retry message. Please try again.";
      notification.style.cssText =
        "position: fixed; top: 20px; right: 20px; background: #ef4444; color: white; padding: 8px 16px; border-radius: 8px; z-index: 9999; font-size: 14px;";
      document.body.appendChild(notification);
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 3000);
    }
  };

  // Get actual message timestamp from Convex data
  const getMessageTimestamp = (messageId: string): number => {
    const convexMessage = conversationData?.messages?.find(
      (m) => m.id === messageId
    );
    return convexMessage?.timestamp || Date.now();
  };

  // Get message provider and model from Convex data
  const getMessageProviderModel = (messageId: string) => {
    const convexMessage = conversationData?.messages?.find(
      (m) => m.id === messageId
    );
    return {
      provider: convexMessage?.provider || selectedProvider,
      model: convexMessage?.model || selectedModel,
    };
  };

  return (
    <div className="flex h-full flex-col relative z-10">
      {/* Header with Sidebar Toggle */}
      <div className="flex items-center gap-3 p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 dawn-gradient">
        <SidebarTrigger className="shrink-0" />
      </div>

      {/* Messages - This will take available space and scroll independently */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="mx-auto max-w-3xl space-y-6">
          {aiMessages.length === 0 ? (
            <div className="flex h-full items-center justify-center min-h-[60vh]">
              <div className="text-center space-y-4">
                <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <span className="text-2xl">💬</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    Start a conversation
                  </h3>
                  <p className="mt-2 text-muted-foreground max-w-md">
                    Ask {currentProvider?.name} anything. Share files, images,
                    or start with a question.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
                  <span>
                    {currentProvider?.name} •{" "}
                    {formatModelName(selectedProvider, selectedModel)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            aiMessages.map((msg, index) => {
              const isEditing = editingMessageId === msg.id;
              const messageProviderModel = getMessageProviderModel(msg.id);

              return (
                <div key={msg.id || index} className="group space-y-3">
                  {/* Message content */}
                  <div
                    className={cn(
                      "prose prose-sm max-w-none",
                      msg.role === "user"
                        ? "ml-auto max-w-[85%] bg-primary/90 text-primary-foreground border-primary/20 rounded-2xl px-4 py-3 shadow-sm"
                        : "max-w-[95%] text-foreground"
                    )}
                  >
                    {/* Message text */}
                    {isEditing ? (
                      <div className="space-y-2">
                        <textarea
                          value={editingContent}
                          onChange={(e) => setEditingContent(e.target.value)}
                          className="w-full resize-none bg-background/80 text-foreground border border-border rounded-lg p-2 min-h-[60px]"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleSaveEdit(msg.id)}
                            className="h-7 px-3 text-xs bg-green-600 hover:bg-green-700"
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancelEdit}
                            className="h-7 px-3 text-xs"
                          >
                            <X className="h-3 w-3 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className={cn(
                          "whitespace-pre-wrap",
                          msg.role === "user"
                            ? "text-primary-foreground"
                            : "text-foreground"
                        )}
                      >
                        {msg.content}
                      </div>
                    )}

                    {/* Display attachments if they exist */}
                    {conversationData?.messages?.find((m) => m.id === msg.id)
                      ?.attachments && (
                      <div className="mt-3 space-y-2">
                        {conversationData.messages
                          .find((m) => m.id === msg.id)
                          ?.attachments?.map((attachment) => (
                            <div
                              key={attachment.url}
                              className={cn(
                                "flex items-center gap-2 text-xs rounded-lg p-2 border",
                                msg.role === "user"
                                  ? "bg-primary/20 border-primary/20"
                                  : "bg-muted/50 border-border/30"
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
                  </div>

                  {/* Message metadata and actions */}
                  <div
                    className={cn(
                      "flex items-center justify-between text-xs text-muted-foreground",
                      msg.role === "user" ? "flex-row-reverse" : "flex-row"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span>
                        {formatTimestamp(getMessageTimestamp(msg.id))}
                      </span>
                      {msg.role === "assistant" && (
                        <span className="text-muted-foreground/60">
                          {currentProvider?.name} •{" "}
                          {formatModelName(
                            messageProviderModel.provider,
                            messageProviderModel.model
                          )}
                        </span>
                      )}
                    </div>

                    {/* Message Actions */}
                    {!isEditing && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {/* Copy button for all messages */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyMessage(msg.content);
                          }}
                          className="p-1.5 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors"
                          title="Copy message"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>

                        {/* Edit button for user messages */}
                        {msg.role === "user" && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditMessage(msg.id, msg.content);
                            }}
                            className="p-1.5 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors"
                            title="Edit message"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                        )}

                        {/* Retry button for all messages */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRetryMessage(index, msg.id);
                          }}
                          className="p-1.5 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors"
                          title="Retry from this message"
                          disabled={aiIsLoading}
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                        </button>

                        {/* Branch button for assistant messages */}
                        {msg.role === "assistant" && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBranchFromMessage(msg.id);
                            }}
                            className="p-1.5 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors"
                            title="Branch conversation from this message"
                          >
                            <GitBranch className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* Loading indicator */}
          {aiIsLoading && (
            <div className="group space-y-3">
              <div className="max-w-[95%] text-foreground">
                <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-muted/30 border border-border/20">
                  <div className="flex gap-1">
                    <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
                    <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
                    <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" />
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {currentProvider?.name} is thinking...
                  </span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Fixed Input Area at Bottom */}
      <div className="shrink-0 border-t border-border/30 px-6 py-4 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-3xl space-y-3">
          {/* File Upload Dropdown */}
          {showUpload && (
            <div className="border border-border/30 rounded-xl p-4 bg-background/60 backdrop-blur-md shadow-lg">
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
            <div className="relative">
              <div className="flex items-end gap-2 min-h-[52px] p-3 border border-input rounded-xl bg-background focus-within:border-ring focus-within:ring-1 focus-within:ring-ring transition-colors">
                <textarea
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                  placeholder={`Message ${currentProvider?.name}...`}
                  className="flex-1 resize-none bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none min-h-[28px] max-h-[200px]"
                  rows={1}
                  disabled={aiIsLoading}
                  style={{
                    minHeight: "28px",
                    height: "28px",
                    lineHeight: "28px",
                  }}
                />

                {/* Send Button - Inside input */}
                <Button
                  type="submit"
                  size="sm"
                  disabled={
                    (!input.trim() && attachments.length === 0) || aiIsLoading
                  }
                  className="h-8 w-8 p-0 rounded-lg bg-primary hover:bg-primary/90 shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Controls Row */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {/* AI Provider Selector */}
                <AIProviderSelector
                  selectedProvider={selectedProvider}
                  selectedModel={selectedModel}
                  reasoningLevel={reasoningLevel}
                  onProviderChange={handleProviderChange}
                  onReasoningChange={handleReasoningChange}
                />

                {/* Direct File Upload Button */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDirectFileUpload}
                  className="h-8 w-8 rounded-full p-0 bg-background/60 backdrop-blur-md border-border/30 hover:bg-background/80 hover:border-border/50 transition-all duration-200"
                  disabled={aiIsLoading}
                  title="Attach files"
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
              </div>

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

      {/* Hidden file input for direct upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        multiple
        accept="image/*,.pdf,.txt,.md,.doc,.docx,.csv,.json,.js,.ts,.html,.css"
        className="hidden"
      />
    </div>
  );
}
