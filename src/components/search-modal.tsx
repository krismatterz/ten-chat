"use client";

import { useQuery } from "convex/react";
import { MessageSquare, Search } from "lucide-react";
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

export function SearchModal() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  // Load conversations for search
  const conversations = useQuery(api.conversations.list, {});

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = (conversationId: string) => {
    setOpen(false);
    router.push(`/chat/${conversationId}`);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search conversations..." />
      <CommandList>
        <CommandEmpty>No conversations found.</CommandEmpty>
        <CommandGroup heading="Recent Conversations">
          {conversations?.slice(0, 10).map((conversation: any) => (
            <CommandItem
              key={conversation._id}
              onSelect={() => handleSelect(conversation._id)}
              className="flex items-center gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              <span className="truncate">{conversation.title}</span>
              <span className="ml-auto text-xs text-muted-foreground">
                {new Date(conversation._creationTime).toLocaleDateString()}
              </span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
