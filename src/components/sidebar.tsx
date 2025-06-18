"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import {
  Plus,
  MessageSquare,
  Settings,
  Archive,
  Search,
  User,
  LogOut,
  Clock,
  FileText,
} from "lucide-react";
import { api } from "../../convex/_generated/api";
import { cn, formatTimestamp, generateChatTitle } from "~/lib/utils";

interface SidebarProps {
  currentChatId?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Sidebar({ currentChatId, isCollapsed = false }: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMode, setSearchMode] = useState<"conversations" | "messages">(
    "conversations"
  );
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const router = useRouter();

  // Debounce search query for message search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Convex hooks
  const conversations = useQuery(api.conversations.list);
  const createConversation = useMutation(api.conversations.create);
  const archiveConversation = useMutation(api.conversations.archive);
  const messageSearchResults = useQuery(
    api.messages.search,
    debouncedQuery.trim() && searchMode === "messages"
      ? { query: debouncedQuery }
      : "skip"
  );

  // Filter conversations based on search
  const filteredConversations = conversations?.filter(
    (conv) =>
      conv.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !conv.isArchived
  );

  // Determine if we should show message search results
  const showMessageResults =
    searchMode === "messages" && debouncedQuery.trim() && messageSearchResults;

  const handleNewChat = async () => {
    try {
      const conversationId = await createConversation({
        title: generateChatTitle("New Chat"),
        model: "claude-3-5-sonnet-20241022",
        provider: "anthropic",
      });

      // Navigate to new chat
      router.push(`/chat/${conversationId}`);
    } catch (error) {
      console.error("Failed to create conversation:", error);
    }
  };

  const handleArchive = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await archiveConversation({ conversationId: conversationId as any });
    } catch (error) {
      console.error("Failed to archive conversation:", error);
    }
  };

  if (isCollapsed) {
    return (
      <div className="flex h-screen w-16 flex-col bg-neutral-900 border-r border-neutral-800">
        <div className="flex items-center justify-center h-16 border-b border-neutral-800">
          <MessageSquare className="h-6 w-6 text-white" />
        </div>

        <div className="flex-1 flex flex-col items-center gap-4 p-3">
          <button
            onClick={handleNewChat}
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            title="New Chat"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col items-center gap-2 p-3 border-t border-neutral-800">
          <button
            className="flex h-10 w-10 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-800 transition-colors"
            title="Settings"
          >
            <Settings className="h-5 w-5" />
          </button>
          <button
            className="flex h-10 w-10 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-800 transition-colors"
            title="Profile"
          >
            <User className="h-5 w-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-80 flex-col bg-neutral-900 border-r border-neutral-800">
      {/* Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-white" />
          <h1 className="font-semibold text-white">Ten Chat</h1>
        </div>

        <button
          onClick={handleNewChat}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          title="New Chat"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-neutral-800 space-y-3">
        {/* Search Mode Toggle */}
        <div className="flex rounded-lg bg-neutral-800 p-1">
          <button
            onClick={() => setSearchMode("conversations")}
            className={cn(
              "flex-1 px-3 py-1 text-xs font-medium rounded-md transition-colors",
              searchMode === "conversations"
                ? "bg-blue-600 text-white"
                : "text-neutral-400 hover:text-white"
            )}
          >
            Chats
          </button>
          <button
            onClick={() => setSearchMode("messages")}
            className={cn(
              "flex-1 px-3 py-1 text-xs font-medium rounded-md transition-colors",
              searchMode === "messages"
                ? "bg-blue-600 text-white"
                : "text-neutral-400 hover:text-white"
            )}
          >
            Messages
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder={
              searchMode === "conversations"
                ? "Search conversations..."
                : "Search messages..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg bg-neutral-800 pl-10 pr-4 py-2 text-sm text-white placeholder-neutral-400 border border-neutral-700 focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {showMessageResults ? (
          /* Message Search Results */
          <div className="space-y-1 p-2">
            {messageSearchResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-neutral-400 text-sm">
                <Search className="h-8 w-8 mb-2" />
                <p>No messages found</p>
                <p className="text-xs">Try a different search term</p>
              </div>
            ) : (
              messageSearchResults.map((result) => (
                <div
                  key={result._id}
                  onClick={() => router.push(`/chat/${result.conversationId}`)}
                  className="group cursor-pointer rounded-lg p-3 transition-colors hover:bg-neutral-800"
                >
                  <div className="flex items-start gap-3">
                    <FileText className="h-4 w-4 shrink-0 text-neutral-400 mt-0.5" />
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-neutral-400">
                          {result.role}
                        </span>
                        <span className="text-xs text-neutral-500">•</span>
                        <span className="text-xs text-neutral-400">
                          {result.conversation?.title}
                        </span>
                      </div>
                      <p
                        className="text-sm text-white mb-1 break-words"
                        style={{
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {result.content.length > 100
                          ? `${result.content.substring(0, 100)}...`
                          : result.content}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-neutral-400">
                        <Clock className="h-3 w-3" />
                        <span>{formatTimestamp(result.timestamp)}</span>
                        {result.conversation?.provider && (
                          <>
                            <span>•</span>
                            <span>{result.conversation.provider}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          /* Conversations List */
          <>
            {filteredConversations?.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-neutral-400 text-sm">
                <MessageSquare className="h-8 w-8 mb-2" />
                <p>No conversations yet</p>
                <p className="text-xs">Start a new chat to begin</p>
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {filteredConversations?.map((conversation) => (
                  <div
                    key={conversation._id}
                    onClick={() => router.push(`/chat/${conversation._id}`)}
                    className={cn(
                      "group relative flex cursor-pointer items-center gap-3 rounded-lg p-3 transition-colors hover:bg-neutral-800",
                      currentChatId === conversation._id
                        ? "bg-neutral-800 border border-neutral-700"
                        : ""
                    )}
                  >
                    <MessageSquare className="h-4 w-4 shrink-0 text-neutral-400" />

                    <div className="flex-1 overflow-hidden">
                      <h3 className="truncate text-sm font-medium text-white">
                        {conversation.title}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-neutral-400">
                        <span>{conversation.provider}</span>
                        <span>•</span>
                        <span>{formatTimestamp(conversation.updatedAt)}</span>
                      </div>
                    </div>

                    {/* Archive button (shows on hover) */}
                    <button
                      onClick={(e) => handleArchive(conversation._id, e)}
                      className="opacity-0 group-hover:opacity-100 h-6 w-6 flex items-center justify-center rounded text-neutral-400 hover:text-white hover:bg-neutral-700 transition-all"
                      title="Archive"
                    >
                      <Archive className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between p-4 border-t border-neutral-800">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-neutral-700 flex items-center justify-center">
            <User className="h-4 w-4 text-neutral-300" />
          </div>
          <div className="text-sm">
            <p className="text-white font-medium">Demo User</p>
            <p className="text-neutral-400 text-xs">Free Plan</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => router.push("/settings")}
            className="h-8 w-8 flex items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-800 transition-colors"
            title="Settings"
          >
            <Settings className="h-4 w-4" />
          </button>
          <button
            className="h-8 w-8 flex items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-800 transition-colors"
            title="Sign Out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
