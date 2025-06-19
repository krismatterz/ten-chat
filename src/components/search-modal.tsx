"use client";

import { useQuery } from "convex/react";
import { MessageSquare, Search, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "../../convex/_generated/api";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command";

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
    router.push(`/chat/${conversationId}`);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      {/* Search Input Header */}
      <div className="flex items-center gap-2 border-b border-border/30 px-4 py-3 bg-background/95 backdrop-blur-md">
        <Search className="h-4 w-4 text-muted-foreground" />
        <CommandInput
          placeholder="Search conversations..."
          className="border-0 p-0 text-sm focus:ring-0 bg-transparent placeholder:text-muted-foreground"
        />
      </div>

      {/* Content Area */}
      <div className="bg-background/95 backdrop-blur-md border-0">
        <CommandList className="max-h-[400px] overflow-y-auto">
          <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
            <MessageSquare className="mx-auto h-8 w-8 mb-2 opacity-50" />
            <p>No conversations found.</p>
            <p className="text-xs mt-1">Try a different search term</p>
          </CommandEmpty>

          <CommandGroup>
            {/* Section Header */}
            <div className="px-3 py-2 text-xs font-semibold text-muted-foreground border-b border-border/30 bg-muted/20">
              💬 Recent Conversations
            </div>

            {conversations?.slice(0, 10).map((conversation: any) => (
              <CommandItem
                key={conversation._id}
                onSelect={() => handleSelect(conversation._id)}
                className="flex items-center gap-3 px-3 py-3 hover:bg-accent/50 cursor-pointer border-0 rounded-none"
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
                    <span className="px-2 py-1 rounded-md bg-muted/50 text-xs font-medium">
                      {conversation.provider}
                    </span>
                  )}
                </div>
              </CommandItem>
            ))}

            {/* Empty State */}
            {conversations && conversations.length === 0 && (
              <div className="p-6 text-center text-muted-foreground text-sm">
                <MessageSquare className="mx-auto h-8 w-8 mb-2 opacity-50" />
                <p className="font-medium">No conversations yet</p>
                <p className="text-xs mt-1">
                  Start a new conversation to see it here
                </p>
              </div>
            )}
          </CommandGroup>
        </CommandList>
      </div>
    </CommandDialog>
  );
}
