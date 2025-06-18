"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import {
  Calendar,
  Home,
  Search,
  Settings,
  MessageSquare,
  Plus,
  Pin,
  Archive,
  User,
  LogOut,
  PanelLeftClose,
  MoreHorizontal,
  Download,
  Trash2,
  Edit2,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "~/components/ui/sidebar";
import { Button } from "~/components/ui/button";
import { BetaBadge } from "~/components/ui/beta-badge";
import { ThemeToggle } from "~/components/ui/theme-toggle";
import { useChatContext } from "~/components/chat-context";
import { api } from "../../convex/_generated/api";
import { cn, formatTimestamp, generateChatTitle } from "~/lib/utils";
import type { Id } from "../../convex/_generated/dataModel";

// Type for conversation data
type Conversation = {
  _id: Id<"conversations">;
  title: string;
  provider?: string;
  updatedAt: number;
  isPinned?: boolean;
  isArchived?: boolean;
};

export function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const { currentChatId } = useChatContext();

  // Convex hooks
  const conversations = useQuery(api.conversations.list);
  const createConversation = useMutation(api.conversations.create);
  const archiveConversation = useMutation(api.conversations.archive);
  const updateConversation = useMutation(api.conversations.update);
  const deleteConversation = useMutation(api.conversations.remove);

  const handleNewChat = async () => {
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
  };

  const handleArchive = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await archiveConversation({
        conversationId: conversationId as Id<"conversations">,
      });
    } catch (error) {
      console.error("Failed to archive conversation:", error);
    }
  };

  const handleDelete = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this conversation?")) {
      try {
        await deleteConversation({
          conversationId: conversationId as Id<"conversations">,
        });
        if (currentChatId === conversationId) {
          router.push("/");
        }
      } catch (error) {
        console.error("Failed to delete conversation:", error);
      }
    }
  };

  const handlePin = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const conversation = conversations?.find((c) => c._id === conversationId);
      if (conversation) {
        await updateConversation({
          conversationId: conversationId as Id<"conversations">,
          title: conversation.title,
          isPinned: !conversation.isPinned,
        });
      }
    } catch (error) {
      console.error("Failed to pin conversation:", error);
    }
  };

  const handleStartEdit = (conversation: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(conversation._id);
    setEditingTitle(conversation.title);
  };

  const handleSaveEdit = async (conversationId: string) => {
    if (editingTitle.trim()) {
      try {
        await updateConversation({
          conversationId: conversationId as Id<"conversations">,
          title: editingTitle.trim(),
        });
      } catch (error) {
        console.error("Failed to update conversation:", error);
      }
    }
    setEditingId(null);
    setEditingTitle("");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingTitle("");
  };

  const handleExport = async (
    conversation: Conversation,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    // TODO: Implement export functionality
    // For now, just create a markdown file with basic info
    const markdownContent = `# ${conversation.title}\n\n**Provider:** ${conversation.provider}\n**Created:** ${new Date(conversation.updatedAt).toLocaleDateString()}\n\n<!-- Messages would be exported here -->\n`;

    const blob = new Blob([markdownContent], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${conversation.title.replace(/[^a-z0-9]/gi, "_")}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDoubleClick = (conversation: Conversation) => {
    setEditingId(conversation._id);
    setEditingTitle(conversation.title);
  };

  // Filter conversations based on search
  const filteredConversations = useMemo(() => {
    if (!conversations) return [];
    return conversations
      .filter(
        (conv) =>
          conv.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !conv.isArchived
      )
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
  }, [conversations, searchQuery]);

  // Group conversations by time periods like T3.chat
  const groupedConversations = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const pinned = filteredConversations.filter((conv) => conv.isPinned);
    const todayConvs = filteredConversations.filter(
      (conv) => !conv.isPinned && new Date(conv.updatedAt) >= today
    );
    const yesterdayConvs = filteredConversations.filter(
      (conv) =>
        !conv.isPinned &&
        new Date(conv.updatedAt) >= yesterday &&
        new Date(conv.updatedAt) < today
    );
    const lastWeekConvs = filteredConversations.filter(
      (conv) =>
        !conv.isPinned &&
        new Date(conv.updatedAt) >= lastWeek &&
        new Date(conv.updatedAt) < yesterday
    );

    return {
      pinned,
      today: todayConvs,
      yesterday: yesterdayConvs,
      lastWeek: lastWeekConvs,
    };
  }, [filteredConversations]);

  const handleLogout = async () => {
    try {
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleConversationClick = (conversationId: string) => {
    if (editingId !== conversationId) {
      router.push(`/chat/${conversationId}`);
    }
  };

  const handleConversationKeyDown = (
    e: React.KeyboardEvent,
    conversationId: string
  ) => {
    if (editingId === conversationId) {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSaveEdit(conversationId);
      } else if (e.key === "Escape") {
        e.preventDefault();
        handleCancelEdit();
      }
      return;
    }

    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      router.push(`/chat/${conversationId}`);
    }
  };

  const renderConversationGroup = (
    conversations: Conversation[],
    title: string,
    icon?: React.ReactNode
  ) => {
    if (conversations.length === 0) return null;

    return (
      <SidebarGroup className="mb-4">
        <SidebarGroupLabel className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
          {icon}
          {title}
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu className="space-y-2">
            {conversations.map((conversation) => (
              <SidebarMenuItem key={conversation._id}>
                <SidebarMenuButton
                  asChild
                  isActive={currentChatId === conversation._id}
                  className="group relative"
                >
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => handleConversationClick(conversation._id)}
                    onDoubleClick={() => handleDoubleClick(conversation)}
                    onKeyDown={(e) =>
                      handleConversationKeyDown(e, conversation._id)
                    }
                    className="flex w-full cursor-pointer items-center gap-3 rounded-md p-3 text-sm transition-colors hover:bg-sidebar-accent focus:outline-none focus:ring-2 focus:ring-sidebar-ring"
                  >
                    <div className="flex items-center gap-2 shrink-0">
                      {conversation.isPinned && (
                        <Pin className="h-3 w-3 text-sidebar-foreground/70" />
                      )}
                      <MessageSquare className="h-4 w-4 text-sidebar-foreground/70" />
                    </div>

                    <div className="flex-1 overflow-hidden">
                      {editingId === conversation._id ? (
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onBlur={() => handleSaveEdit(conversation._id)}
                          className="w-full bg-transparent border-none outline-none font-medium text-sidebar-foreground"
                          autoFocus
                        />
                      ) : (
                        <h3 className="truncate font-medium text-sidebar-foreground">
                          {conversation.title}
                        </h3>
                      )}
                      <div className="flex items-center gap-1 text-xs text-sidebar-foreground/60">
                        <span className="capitalize">
                          {conversation.provider}
                        </span>
                        <span>•</span>
                        <span>{formatTimestamp(conversation.updatedAt)}</span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={(e) => handleStartEdit(conversation, e)}
                        className="h-6 w-6 flex items-center justify-center rounded text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all"
                        title="Rename"
                        aria-label={`Rename conversation ${conversation.title}`}
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handlePin(conversation._id, e)}
                        className="h-6 w-6 flex items-center justify-center rounded text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all"
                        title={conversation.isPinned ? "Unpin" : "Pin"}
                        aria-label={`${conversation.isPinned ? "Unpin" : "Pin"} conversation ${conversation.title}`}
                      >
                        <Pin
                          className={cn(
                            "h-3 w-3",
                            conversation.isPinned && "fill-current"
                          )}
                        />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleExport(conversation, e)}
                        className="h-6 w-6 flex items-center justify-center rounded text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all"
                        title="Export as Markdown"
                        aria-label={`Export conversation ${conversation.title} as Markdown`}
                      >
                        <Download className="h-3 w-3" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleDelete(conversation._id, e)}
                        className="h-6 w-6 flex items-center justify-center rounded text-sidebar-foreground/60 hover:text-red-500 hover:bg-sidebar-accent transition-all"
                        title="Delete"
                        aria-label={`Delete conversation ${conversation.title}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  };

  return (
    <Sidebar
      variant="inset"
      collapsible="offcanvas"
      className="bg-sidebar border-sidebar-border"
    >
      <SidebarHeader>
        {/* Just the New Chat button - removed SidebarTrigger */}
        <div className="p-2">
          <Button
            onClick={handleNewChat}
            className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            size="sm"
          >
            <Plus className="h-4 w-4 shrink-0" />
            <span>New Chat</span>
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Search */}
        <SidebarGroup>
          <SidebarGroupContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sidebar-foreground/60" />
              <SidebarInput
                placeholder="Search your threads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-sidebar-accent border-sidebar-border"
              />
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Conversations organized by time periods with proper spacing */}
        <div className="space-y-4">
          {renderConversationGroup(
            groupedConversations.pinned,
            "Pinned",
            <Pin className="h-3 w-3" />
          )}

          {renderConversationGroup(groupedConversations.today, "Today")}

          {renderConversationGroup(groupedConversations.yesterday, "Yesterday")}

          {renderConversationGroup(
            groupedConversations.lastWeek,
            "Last 7 Days"
          )}
        </div>

        {/* Empty state */}
        {filteredConversations.length === 0 && (
          <SidebarGroup>
            <SidebarGroupContent>
              <div className="flex flex-col items-center justify-center h-32 text-center text-sidebar-foreground/60 text-sm">
                <MessageSquare className="h-8 w-8 mb-2" />
                <p>No conversations yet</p>
                <p className="text-xs">Start a new chat to begin</p>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        {/* Settings, Theme toggle, and User section in footer */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Settings */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/settings"}>
                  <a href="/settings" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Theme Toggle */}
              <SidebarMenuItem>
                <div className="flex items-center justify-between px-2 py-2">
                  <ThemeToggle />
                </div>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* User section */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <User className="h-4 w-4" />
                  <span>Demo User</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  );
}
