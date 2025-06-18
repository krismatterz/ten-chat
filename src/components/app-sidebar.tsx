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
  Bot,
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

// Menu items
const items = [
  {
    title: "Chat",
    url: "/",
    icon: MessageSquare,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
];

export function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");
  const { currentChatId } = useChatContext();

  // Convex hooks
  const conversations = useQuery(api.conversations.list);
  const createConversation = useMutation(api.conversations.create);
  const archiveConversation = useMutation(api.conversations.archive);

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
      await archiveConversation({ conversationId: conversationId as any });
    } catch (error) {
      console.error("Failed to archive conversation:", error);
    }
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

  const renderConversationGroup = (
    conversations: any[],
    title: string,
    icon?: React.ReactNode
  ) => {
    if (conversations.length === 0) return null;

    return (
      <SidebarGroup>
        <SidebarGroupLabel className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          {icon}
          {title}
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {conversations.map((conversation) => (
              <SidebarMenuItem key={conversation._id}>
                <SidebarMenuButton
                  asChild
                  isActive={currentChatId === conversation._id}
                  className="group relative"
                >
                  <div
                    onClick={() => router.push(`/chat/${conversation._id}`)}
                    className="flex w-full cursor-pointer items-center gap-3 rounded-md p-2 text-sm transition-colors hover:bg-accent"
                  >
                    <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="flex-1 overflow-hidden">
                      <h3 className="truncate font-medium">
                        {conversation.title}
                      </h3>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <span className="capitalize">
                          {conversation.provider}
                        </span>
                        <span>•</span>
                        <span>{formatTimestamp(conversation.updatedAt)}</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleArchive(conversation._id, e)}
                      className="opacity-0 group-hover:opacity-100 h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                      title="Archive"
                    >
                      <Archive className="h-3 w-3" />
                    </button>
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
    <Sidebar variant="inset">
      <SidebarHeader>
        {/* Logo and New Chat */}
        <div className="flex items-center justify-between p-2">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <span className="font-semibold">Ten Chat</span>
            <BetaBadge />
          </div>
        </div>

        <Button onClick={handleNewChat} className="m-2 gap-2">
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </SidebarHeader>

      <SidebarContent>
        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.url ||
                  (item.url === "/" && pathname.startsWith("/chat"));

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <a href={item.url} className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Search */}
        <SidebarGroup>
          <SidebarGroupContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <SidebarInput
                placeholder="Search your threads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Conversations organized by time periods */}
        {renderConversationGroup(
          groupedConversations.pinned,
          "Pinned",
          <Pin className="h-3 w-3" />
        )}

        {renderConversationGroup(groupedConversations.today, "Today")}

        {renderConversationGroup(groupedConversations.yesterday, "Yesterday")}

        {renderConversationGroup(groupedConversations.lastWeek, "Last 7 Days")}

        {/* Empty state */}
        {filteredConversations.length === 0 && (
          <SidebarGroup>
            <SidebarGroupContent>
              <div className="flex flex-col items-center justify-center h-32 text-center text-muted-foreground text-sm">
                <MessageSquare className="h-8 w-8 mb-2" />
                <p>No conversations yet</p>
                <p className="text-xs">Start a new chat to begin</p>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        {/* Theme toggle */}
        <SidebarGroup>
          <SidebarGroupContent>
            <div className="flex items-center justify-center py-2">
              <ThemeToggle />
            </div>
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
