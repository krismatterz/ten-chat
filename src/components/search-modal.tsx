"use client";

import { useQuery } from "convex/react";
import { MessageSquare, Search, Clock, Command } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "../../convex/_generated/api";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

interface SearchModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const formatRelativeTime = (timestamp: number) => {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
};

export function SearchModal({
  open: controlledOpen,
  onOpenChange,
}: SearchModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const router = useRouter();

  // Use controlled state if provided, otherwise use internal state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  // Load conversations for search
  const conversations = useQuery(api.conversations.list, {});

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [setOpen, open]);

  const handleSelect = (conversationId: string) => {
    setOpen(false);
    setSearch("");
    router.push(`/chat/${conversationId}`);
  };

  // Filter conversations based on search
  const filteredConversations = conversations?.filter((conversation: any) =>
    conversation.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-2">
          <Search className="h-4 w-4" />
          <span className="text-sm">Search</span>
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-96 p-0 bg-background/95 backdrop-blur-md border border-border/30 shadow-lg"
        align="start"
      >
        {/* Search */}
        <div className="p-3 border-b">
          <Input
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8"
            autoFocus
          />
        </div>

        {/* Conversations List */}
        <div className="max-h-[400px] overflow-y-auto">
          {/* Recent Conversations Section */}
          {filteredConversations && filteredConversations.length > 0 && (
            <div>
              <div className="px-3 py-2 text-xs font-semibold text-muted-foreground border-b">
                💬 Recent Conversations
              </div>
              {filteredConversations.slice(0, 10).map((conversation: any) => (
                <div
                  key={conversation._id}
                  onClick={() => handleSelect(conversation._id)}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-accent text-left cursor-pointer"
                >
                  {/* Icon */}
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="h-4 w-4 text-primary" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate text-foreground">
                      {conversation.title}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(conversation._creationTime)}
                      </span>
                      {conversation.messageCount && (
                        <>
                          <span className="text-muted-foreground/60">•</span>
                          <span className="text-xs text-muted-foreground">
                            {conversation.messageCount} messages
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Provider Badge */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {conversation.provider && (
                      <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-muted">
                        {conversation.provider}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* No Results */}
          {filteredConversations &&
            filteredConversations.length === 0 &&
            search && (
              <div className="p-4 text-center text-muted-foreground text-sm">
                <MessageSquare className="mx-auto h-8 w-8 mb-2 opacity-50" />
                <p>No conversations found</p>
                <p className="text-xs mt-1">Try a different search term</p>
              </div>
            )}

          {/* Empty State */}
          {(!conversations || conversations.length === 0) && (
            <div className="p-4 text-center text-muted-foreground text-sm">
              <MessageSquare className="mx-auto h-8 w-8 mb-2 opacity-50" />
              <p>No conversations yet</p>
              <p className="text-xs mt-1">
                Start a new conversation to see it here
              </p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
