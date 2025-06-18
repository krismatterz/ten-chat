"use client";

/**
 * Modern Sidebar Component for Ten Chat
 *
 * Layout Strategy:
 * - Navigation items at the top
 * - Search functionality
 * - Conversations list
 * - Clean collapsed state with just icons
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { cn } from "~/lib/utils";
import { Button } from "./ui/button";
import { BetaBadge } from "./ui/beta-badge";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Settings,
  ChevronLeft,
  User,
  LogOut,
  Plus,
  Search,
  Archive,
  Clock,
  FileText,
  Bot,
} from "lucide-react";
import { api } from "../../convex/_generated/api";
import { ThemeToggle } from "./ui/theme-toggle";

// Navigation items are static and memoized outside component
const sidebarItems = [
  {
    title: "Chat",
    href: "/chat",
    icon: MessageSquare,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
] as const;

type NavItem = (typeof sidebarItems)[number];

// Get initial collapsed state from localStorage during module initialization
const getInitialCollapsed = () => {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("sidebarCollapsed");
    return saved === "true";
  }
  return false;
};

interface SidebarProps {
  currentChatId?: string;
}

export function Sidebar({ currentChatId }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  // State management
  const [isCollapsed, setIsCollapsed] = useState(() => getInitialCollapsed());
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMode, setSearchMode] = useState<"conversations" | "messages">(
    "conversations"
  );
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce search query
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

  // Memoize handlers and values to prevent unnecessary re-renders
  const handleCollapse = useCallback((value: boolean) => {
    setIsCollapsed(value);
    localStorage.setItem("sidebarCollapsed", String(value));
  }, []);

  const handleNewChat = useCallback(async () => {
    try {
      const conversationId = await createConversation({
        title: generateChatTitle("New Chat"),
        model: "claude-3-5-sonnet-20241022",
        provider: "anthropic",
      });
      router.push(`/chat/${conversationId}`);
    } catch (error) {
      console.error("Failed to create conversation:", error);
    }
  }, [createConversation, router]);

  const handleArchive = useCallback(
    async (conversationId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      try {
        await archiveConversation({ conversationId: conversationId as any });
      } catch (error) {
        console.error("Failed to archive conversation:", error);
      }
    },
    [archiveConversation]
  );

  // Filter conversations based on search
  const filteredConversations = useMemo(
    () =>
      conversations?.filter(
        (conv) =>
          conv.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !conv.isArchived
      ),
    [conversations, searchQuery]
  );

  // Determine if we should show message search results
  const showMessageResults =
    searchMode === "messages" && debouncedQuery.trim() && messageSearchResults;

  const displayName = useMemo(() => "Demo User", []);

  const handleLogout = useCallback(async () => {
    try {
      // Add your logout logic here
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }, [router]);

  return (
    <div className="sticky top-0 hidden h-screen p-6 md:block">
      <div
        className={cn(
          "bg-background/95 supports-[backdrop-filter]:bg-background/60 relative h-full rounded-xl border shadow-lg backdrop-blur transition-all duration-300 ease-in-out",
          isCollapsed ? "w-[70px]" : "w-[280px]"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Collapse toggle button */}
          <Button
            variant="ghost"
            size="icon"
            className="bg-background absolute -right-3 top-12 h-6 w-6 rounded-full border shadow-sm z-50"
            onClick={() => handleCollapse(!isCollapsed)}
          >
            <AnimatePresence initial={false} mode="wait">
              <motion.div
                key={isCollapsed ? "collapsed" : "expanded"}
                initial={{ rotate: isCollapsed ? 0 : 180 }}
                animate={{ rotate: isCollapsed ? 180 : 0 }}
                transition={{
                  duration: 0.3,
                  ease: "easeInOut",
                }}
                className="flex items-center justify-center"
              >
                <ChevronLeft className="h-3 w-3" />
              </motion.div>
            </AnimatePresence>
          </Button>

          {/* Logo section */}
          <div className="p-4">
            <div
              className={cn(
                "flex h-5 items-center",
                isCollapsed ? "justify-center" : ""
              )}
            >
              {isCollapsed ? (
                <Bot className="h-5 w-5 text-primary" />
              ) : (
                <>
                  <AnimatePresence initial={false}>
                    <motion.div
                      className="flex items-center overflow-hidden"
                      initial={false}
                      animate={{ width: "auto", opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <span className="whitespace-nowrap font-semibold">
                        Ten Chat
                      </span>
                    </motion.div>
                  </AnimatePresence>
                  <motion.div
                    layout
                    transition={{ duration: 0.3 }}
                    className="ml-2"
                  >
                    <BetaBadge />
                  </motion.div>
                </>
              )}
            </div>
          </div>

          {/* New Chat Button */}
          <div className="px-4 pb-4">
            <Button
              onClick={handleNewChat}
              className={cn(
                "relative h-9 overflow-hidden rounded-md",
                isCollapsed ? "w-9 px-0" : "w-full"
              )}
            >
              <div className="flex h-full w-full items-center">
                <div className="flex h-full w-9 shrink-0 items-center justify-center">
                  <Plus className="h-4 w-4" />
                </div>
                <AnimatePresence initial={false}>
                  {!isCollapsed && (
                    <motion.div
                      className="ml-2 flex-1 overflow-hidden text-left"
                      initial={false}
                      animate={{ width: "auto", opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <span className="whitespace-nowrap text-sm">
                        New Chat
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto">
            {/* Navigation Items */}
            <div className="px-4 pb-4">
              <div className="space-y-1">
                {sidebarItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname.startsWith(item.href);

                  return (
                    <Button
                      key={item.href}
                      variant="ghost"
                      className={cn(
                        "hover:bg-accent relative h-9 overflow-hidden rounded-md px-0",
                        isCollapsed ? "w-9" : "w-full",
                        isActive && "bg-secondary hover:bg-secondary"
                      )}
                      asChild
                    >
                      <Link href={item.href}>
                        <div className="flex h-full w-full items-center">
                          <div className="flex h-full w-9 shrink-0 items-center justify-center">
                            <Icon className="h-4 w-4" />
                          </div>
                          <AnimatePresence initial={false}>
                            {!isCollapsed && (
                              <motion.div
                                className="ml-2 flex-1 overflow-hidden text-left"
                                initial={false}
                                animate={{ width: "auto", opacity: 1 }}
                                exit={{ width: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                              >
                                <span className="whitespace-nowrap text-sm">
                                  {item.title}
                                </span>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </Link>
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Search Section */}
            {!isCollapsed && (
              <motion.div
                className="px-4 pb-4 border-t pt-4 space-y-3"
                initial={false}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                {/* Search Mode Toggle */}
                <div className="flex rounded-lg bg-secondary p-1">
                  <button
                    onClick={() => setSearchMode("conversations")}
                    className={cn(
                      "flex-1 px-3 py-1 text-xs font-medium rounded-md transition-colors",
                      searchMode === "conversations"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Chats
                  </button>
                  <button
                    onClick={() => setSearchMode("messages")}
                    className={cn(
                      "flex-1 px-3 py-1 text-xs font-medium rounded-md transition-colors",
                      searchMode === "messages"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Messages
                  </button>
                </div>

                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder={
                      searchMode === "conversations"
                        ? "Search conversations..."
                        : "Search messages..."
                    }
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-lg bg-background border border-input pl-10 pr-4 py-2 text-sm placeholder-muted-foreground focus:border-ring focus:outline-none"
                  />
                </div>
              </motion.div>
            )}

            {/* Conversations List */}
            {!isCollapsed && !showMessageResults && (
              <motion.div
                className="px-4 pb-4 border-t pt-4"
                initial={false}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {filteredConversations?.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm">
                    <MessageSquare className="h-8 w-8 mb-2" />
                    <p>No conversations yet</p>
                    <p className="text-xs">Start a new chat to begin</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredConversations?.map((conversation) => (
                      <div
                        key={conversation._id}
                        onClick={() => router.push(`/chat/${conversation._id}`)}
                        className={cn(
                          "group relative flex cursor-pointer items-center gap-3 rounded-lg p-3 transition-colors hover:bg-accent",
                          currentChatId === conversation._id
                            ? "bg-secondary border"
                            : ""
                        )}
                      >
                        <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />

                        <div className="flex-1 overflow-hidden">
                          <h3 className="truncate text-sm font-medium">
                            {conversation.title}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="capitalize">
                              {conversation.provider}
                            </span>
                            <span>•</span>
                            <span>
                              {formatTimestamp(conversation.updatedAt)}
                            </span>
                          </div>
                        </div>

                        {/* Archive button (shows on hover) */}
                        <button
                          onClick={(e) => handleArchive(conversation._id, e)}
                          className="opacity-0 group-hover:opacity-100 h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                          title="Archive"
                        >
                          <Archive className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Message Search Results */}
            {!isCollapsed && showMessageResults && (
              <div className="px-4 pb-4 space-y-1">
                {messageSearchResults.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm">
                    <Search className="h-8 w-8 mb-2" />
                    <p>No messages found</p>
                    <p className="text-xs">Try a different search term</p>
                  </div>
                ) : (
                  messageSearchResults.map((result) => (
                    <div
                      key={result._id}
                      onClick={() =>
                        router.push(`/chat/${result.conversationId}`)
                      }
                      className="group cursor-pointer rounded-lg p-3 transition-colors hover:bg-accent"
                    >
                      <div className="flex items-start gap-3">
                        <FileText className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
                        <div className="flex-1 overflow-hidden">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-muted-foreground">
                              {result.role}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              •
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {result.conversation?.title}
                            </span>
                          </div>
                          <p
                            className="text-sm mb-1 break-words"
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
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{formatTimestamp(result.timestamp)}</span>
                            {result.conversation?.provider && (
                              <>
                                <span>•</span>
                                <span className="capitalize">
                                  {result.conversation.provider}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Bottom utilities section */}
          <div className="mt-auto border-t">
            <div className="flex flex-col gap-1 p-4">
              {/* Theme toggle */}
              <div className="pb-2 border-b">
                <ThemeToggle collapsed={isCollapsed} />
              </div>

              {/* User profile section */}
              <div className="flex flex-col gap-1">
                <Button
                  variant="ghost"
                  className={cn(
                    "hover:bg-accent relative h-9 overflow-hidden rounded-md px-0",
                    isCollapsed ? "w-9" : "w-full"
                  )}
                >
                  <div className="flex h-full w-full items-center">
                    <motion.div
                      layout
                      transition={{ duration: 0.3 }}
                      className="flex h-full w-9 shrink-0 items-center justify-center"
                    >
                      <User className="h-4 w-4" />
                    </motion.div>
                    <AnimatePresence initial={false} mode="wait">
                      {!isCollapsed && displayName && (
                        <motion.div
                          key="username"
                          className="ml-2 flex-1 overflow-hidden text-left"
                          initial={{ width: 0, opacity: 0 }}
                          animate={{ width: "auto", opacity: 1 }}
                          exit={{ width: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                        >
                          <motion.span
                            layout
                            className="block whitespace-nowrap text-sm"
                          >
                            {displayName}
                          </motion.span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </Button>
                <Button
                  variant="ghost"
                  className={cn(
                    "hover:bg-accent relative h-9 overflow-hidden rounded-md px-0",
                    isCollapsed ? "w-9" : "w-full"
                  )}
                  onClick={handleLogout}
                >
                  <div className="flex h-full w-full items-center">
                    <div className="flex h-full w-9 shrink-0 items-center justify-center">
                      <LogOut className="h-4 w-4" />
                    </div>
                    <AnimatePresence initial={false}>
                      {!isCollapsed && (
                        <motion.div
                          className="ml-2 flex-1 overflow-hidden text-left"
                          initial={false}
                          animate={{ width: "auto", opacity: 1 }}
                          exit={{ width: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <span className="whitespace-nowrap text-sm">
                            Logout
                          </span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
