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
  Brain,
  ChevronDown,
  ChevronRight,
  Search,
  Settings,
  Moon,
  Sun,
} from "lucide-react";
import { nanoid } from "nanoid";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { AI_PROVIDERS, type ProviderType } from "~/lib/providers";
import {
  cn,
  formatModelName,
  formatProviderName,
  formatTimestamp,
  generateChatTitle,
} from "~/lib/utils";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { AIProviderSelector } from "./ai-provider-selector";
import { FileUpload } from "./file-upload";
import { SearchModal } from "./search-modal";
import { Button } from "./ui/button";
import { SidebarTrigger } from "./ui/sidebar";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuTrigger,
} from "./ui/context-menu";

interface FileAttachment {
  name: string;
  url: string;
  type: string;
  size: number;
}

interface ChatProps {
  chatId: string;
}

// Helper function to check if model supports reasoning
const supportsReasoning = (model: string) => {
  const reasoningModels = [
    "o3-mini-2025-01-31",
    "o3-2025-04-16",
    "claude-3.5-sonnet",
    "claude-3-7-sonnet-20250219",
    "claude-4-sonnet-20250522",
    "sonar-pro",
  ];
  return reasoningModels.some((reasoningModel) =>
    model.includes(reasoningModel)
  );
};

// Thinking Button Component
interface ThinkingButtonProps {
  reasoningLevel: "low" | "mid" | "high";
  onReasoningChange: (level: "low" | "mid" | "high") => void;
  disabled?: boolean;
}

function ThinkingButton({
  reasoningLevel,
  onReasoningChange,
  disabled,
}: ThinkingButtonProps) {
  const getReasoningLabel = (level: "low" | "mid" | "high") => {
    switch (level) {
      case "low":
        return "Quick";
      case "mid":
        return "Balanced";
      case "high":
        return "Deep";
    }
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 w-8 rounded-full p-0 bg-background/60 backdrop-blur-md border-border/30 hover:bg-background/80 hover:border-border/50 transition-all duration-200"
          disabled={disabled}
          title={`Thinking mode: ${getReasoningLabel(reasoningLevel)}`}
        >
          <Brain className="h-4 w-4 text-purple-500" />
        </Button>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-40">
        <ContextMenuRadioGroup
          value={reasoningLevel}
          onValueChange={(value) =>
            onReasoningChange(value as "low" | "mid" | "high")
          }
        >
          <ContextMenuRadioItem value="low" className="flex items-center gap-2">
            <Brain className="h-3 w-3 text-green-500" />
            Quick
          </ContextMenuRadioItem>
          <ContextMenuRadioItem value="mid" className="flex items-center gap-2">
            <Brain className="h-3 w-3 text-yellow-500" />
            Balanced
          </ContextMenuRadioItem>
          <ContextMenuRadioItem
            value="high"
            className="flex items-center gap-2"
          >
            <Brain className="h-3 w-3 text-red-500" />
            Deep
          </ContextMenuRadioItem>
        </ContextMenuRadioGroup>
      </ContextMenuContent>
    </ContextMenu>
  );
}

export function Chat({ chatId }: ChatProps) {
  const router = useRouter();
  const { setTheme, theme } = useTheme();
  const [isFirstMessage, setIsFirstMessage] = useState(true);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  const updateMessage = useMutation(api.conversations.updateMessage);
  const deleteMessagesFromPoint = useMutation(
    api.conversations.deleteMessagesFromPoint
  );
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

  // Query user preferences for personalized assistant
  const userPrefs = useQuery(api.users.getPreferences);

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
              // Store the actual provider and model used for this response
              provider: selectedProvider,
              model: selectedModel,
            });
            console.log("✅ AI message saved to Convex");
          }
        } catch (error) {
          console.error("❌ Failed to save AI message to Convex:", error);
        }
      }
      setIsSubmitting(false);
    },
    onError: (error) => {
      console.error("💥 Chat API error:", error);
      setIsSubmitting(false);
    },
  });

  // Use loading state from AI SDK v4
  const aiIsLoading = isLoading || isSubmitting;

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

    console.log("📁 Direct file input - files selected:", files.length);

    // Show upload area when files are selected via direct input
    setShowUpload(true);

    // Clear the input
    event.target.value = "";

    // Note: Files will be handled by the FileUpload component's UploadThing integration
    // This ensures proper upload to cloud storage rather than temporary blob URLs
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && attachments.length === 0) return;
    if (aiIsLoading) return; // Prevent duplicate submissions

    setIsSubmitting(true);

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
        // Store current provider and model for user message too
        provider: selectedProvider,
        model: selectedModel,
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
      setIsSubmitting(false);
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
      if (!conversationId) return;

      // Get the original message content to check if it actually changed
      const originalMessage = aiMessages.find((msg) => msg.id === messageId);
      if (!originalMessage) return;

      // If content hasn't changed, just cancel edit
      if (originalMessage.content === editingContent.trim()) {
        handleCancelEdit();
        return;
      }

      // Update message in Convex
      await updateMessage({
        conversationId,
        messageId,
        content: editingContent,
      });

      // Clear editing state first
      setEditingMessageId(null);
      setEditingContent("");

      // Find the updated message and check if it's a user message
      if (originalMessage && originalMessage.role === "user") {
        // For user messages, delete all subsequent messages and trigger new AI response
        await deleteMessagesFromPoint({
          conversationId,
          fromMessageId: messageId,
        });

        // Update local state to show only messages up to the edited message
        const messageIndex = aiMessages.findIndex(
          (msg) => msg.id === messageId
        );
        if (messageIndex !== -1) {
          const messagesToKeep = aiMessages.slice(0, messageIndex);
          const updatedMessage = {
            ...originalMessage,
            content: editingContent,
          };
          const newMessages = [...messagesToKeep, updatedMessage];
          setAiMessages(newMessages);

          // Trigger new AI response using the updated message content
          const fakeEvent = {
            preventDefault: () => {},
            target: {
              elements: {
                message: { value: editingContent },
              },
            },
          } as unknown as React.FormEvent;

          // Temporarily update input to edited content
          const currentInput = input;
          handleInputChange({
            target: { value: editingContent },
          } as React.ChangeEvent<HTMLTextAreaElement>);

          // Submit after short delay to ensure state is updated
          setTimeout(async () => {
            try {
              await aiHandleSubmit(fakeEvent);
              // Reset input
              handleInputChange({
                target: { value: currentInput },
              } as React.ChangeEvent<HTMLTextAreaElement>);
            } catch (error) {
              console.error("Failed to generate new AI response:", error);
            }
          }, 50);
        }
      } else {
        // For assistant messages, just update locally
        setAiMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId ? { ...msg, content: editingContent } : msg
          )
        );
      }

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
      // Reset editing state on error
      setEditingMessageId(null);
      setEditingContent("");
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
    if (!conversationId) return;

    console.log("🔄 Retrying message at index:", messageIndex);

    try {
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

      let lastUserMessage: typeof currentMessage | undefined;
      let retryFromMessageId: string | undefined;

      if (currentMessage.role === "user") {
        // Retrying from a user message
        lastUserMessage = currentMessage;
        retryFromMessageId = currentMessage.id;
      } else {
        // Retrying from an AI response - get the previous user message
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
        retryFromMessageId = previousMessage.id;
      }

      if (!lastUserMessage || !retryFromMessageId) {
        console.error("Could not determine user message for retry");
        return;
      }

      console.log("🔄 Deleting messages from:", retryFromMessageId);

      try {
        // Delete messages from this point in Convex database
        await deleteMessagesFromPoint({
          conversationId,
          fromMessageId: retryFromMessageId,
        });
        console.log("✅ Messages deleted from Convex");
      } catch (convexError) {
        console.error("❌ Convex deleteMessagesFromPoint error:", convexError);
        // Continue with local state update even if Convex fails
      }

      // Update local state to show only messages up to the retry point
      const retryFromIndex = aiMessages.findIndex(
        (msg) => msg.id === retryFromMessageId
      );
      const messagesToKeep = aiMessages.slice(0, retryFromIndex + 1);
      setAiMessages(messagesToKeep);

      // Trigger new AI response
      console.log(
        "🔄 Triggering new AI response with:",
        lastUserMessage.content
      );

      const fakeEvent = {
        preventDefault: () => {},
        target: {
          elements: {
            message: { value: lastUserMessage.content },
          },
        },
      } as unknown as React.FormEvent;

      const previousInput = input;

      // Set input to the user message content temporarily
      handleInputChange({
        target: { value: lastUserMessage.content },
      } as React.ChangeEvent<HTMLTextAreaElement>);

      // Wait for state update then submit
      setTimeout(async () => {
        try {
          await aiHandleSubmit(fakeEvent);
          console.log("✅ AI resubmitted successfully");
          // Reset input back to what it was
          handleInputChange({
            target: { value: previousInput },
          } as React.ChangeEvent<HTMLTextAreaElement>);
        } catch (error) {
          console.error("❌ Failed to resubmit to AI:", error);
          handleInputChange({
            target: { value: previousInput },
          } as React.ChangeEvent<HTMLTextAreaElement>);
        }
      }, 50);

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

  // Get message provider and model from Convex data with fallback
  const getMessageProviderModel = (messageId: string) => {
    const convexMessage = conversationData?.messages?.find(
      (m) => m.id === messageId
    );

    // Use message-specific provider/model if available, otherwise fall back to current selection
    return {
      provider: convexMessage?.provider || selectedProvider,
      model: convexMessage?.model || selectedModel,
    };
  };

  return (
    <div className="flex h-full flex-col relative z-10 transition-all duration-300 ease-in-out">
      {/* Top navigation bar with controls */}
      <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-3">
          <SidebarTrigger className="shrink-0" />
          <SearchModal open={searchOpen} onOpenChange={setSearchOpen} />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/settings")}
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="flex items-center gap-2"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
        </div>
      </div>

      {/* Messages - This will take available space and scroll independently */}
      <div className="flex-1 overflow-y-auto px-4 py-4 transition-all duration-300 ease-in-out">
        <div className="mx-auto max-w-4xl space-y-6">
          {aiMessages.length === 0 ? (
            <div className="flex h-full items-center justify-center min-h-[60vh]">
              <div className="text-center space-y-4">
                <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <span className="text-2xl">🤖</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {userPrefs?.displayName
                      ? `Hi ${userPrefs.displayName}! I'm Ten Chat, how can I help you?`
                      : "Hi! I'm Ten Chat, how can I help you?"}
                  </h3>
                  <div className="mt-3 space-y-2">
                    {/* {userPrefs?.traits && userPrefs.traits.length > 0 && (
                      <p className="text-sm text-muted-foreground">
                        I'll be {userPrefs.traits.slice(0, 3).join(", ")} in our
                        conversation.
                      </p>
                    )}
                    {userPrefs?.jobTitle && (
                      <p className="text-sm text-muted-foreground">
                        I understand you work as a {userPrefs.jobTitle}.
                      </p>
                    )} */}
                    <p className="text-muted-foreground max-w-md">
                      Ask me anything, share files, images, or search old
                      conversations.
                    </p>
                  </div>
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
                <div key={`${msg.id}-${index}`} className="group space-y-3">
                  <div
                    className={cn(
                      "flex gap-2 items-start",
                      msg.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    {/* Message content */}
                    <div
                      className={cn(
                        "prose prose-sm max-w-none",
                        msg.role === "user"
                          ? "max-w-[85%] bg-primary/90 text-primary-foreground border-primary/20 rounded-2xl px-4 py-3 shadow-sm"
                          : "max-w-[95%] text-foreground"
                      )}
                    >
                      {/* Message text */}
                      {isEditing ? (
                        <div className="space-y-2">
                          <textarea
                            value={editingContent}
                            onChange={(e) => setEditingContent(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Escape") {
                                handleCancelEdit();
                              } else if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSaveEdit(msg.id);
                              }
                            }}
                            className="w-full resize-none bg-background/90 text-foreground border border-border/50 rounded-lg p-3 min-h-[60px] focus:border-ring focus:ring-1 focus:ring-ring focus:outline-none"
                            placeholder="Edit your message..."
                          />
                          <div className="flex gap-2 text-xs text-muted-foreground">
                            <kbd className="px-1.5 py-0.5 bg-muted rounded border">
                              Enter
                            </kbd>{" "}
                            to save
                            <span>•</span>
                            <kbd className="px-1.5 py-0.5 bg-muted rounded border">
                              Esc
                            </kbd>{" "}
                            to cancel
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

                    {/* Message Actions for user messages - keep on right */}
                    {!isEditing && msg.role === "user" && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                        {/* Copy button */}
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

                        {/* Retry button */}
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
                      </div>
                    )}
                  </div>

                  {/* AI Message Actions - Below the message */}
                  {!isEditing && msg.role === "assistant" && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity mt-2">
                      {/* Copy button */}
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

                      {/* Retry button */}
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

                      {/* Branch button */}
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
                    </div>
                  )}

                  {/* Message metadata - Only show provider/timestamp for assistant messages */}
                  {msg.role === "assistant" && !isEditing && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                      <span>
                        {formatTimestamp(getMessageTimestamp(msg.id))}
                      </span>
                      <span className="text-muted-foreground/60">
                        {formatProviderName(messageProviderModel.provider)} •{" "}
                        {formatModelName(
                          messageProviderModel.provider,
                          messageProviderModel.model
                        )}
                      </span>
                    </div>
                  )}
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
                    {formatModelName(selectedProvider, selectedModel)} is
                    thinking...
                  </span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Fixed Input Area at Bottom */}
      <div className="shrink-0 border-t border-border/30 px-4 py-6 bg-background/80 backdrop-blur-xl transition-all duration-300 ease-in-out">
        <div className="mx-auto max-w-4xl space-y-4">
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
                  placeholder={`Message ${formatModelName(selectedProvider, selectedModel)}...`}
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

                {/* Thinking Button - Only show for reasoning-capable models */}
                {supportsReasoning(selectedModel) && (
                  <ThinkingButton
                    reasoningLevel={reasoningLevel}
                    onReasoningChange={handleReasoningChange}
                    disabled={aiIsLoading}
                  />
                )}
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
