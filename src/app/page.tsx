"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "~/components/ui/button";

export default function HomePage() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const hasRedirected = useRef(false);
  const [isCreatingChat, setIsCreatingChat] = useState(false);

  const createConversation = useMutation(api.conversations.create);

  useEffect(() => {
    if (isLoaded && !hasRedirected.current) {
      hasRedirected.current = true;
      if (!isSignedIn) {
        router.push("/sign-in");
      }
      // Let signed-in users see the homepage interface
    }
  }, [isSignedIn, isLoaded, router]);

  const handleNewChat = async () => {
    if (isCreatingChat) return;

    setIsCreatingChat(true);
    try {
      // Get current user preferences from localStorage or use defaults
      const selectedProvider =
        (localStorage.getItem("tenchat-provider") as string) || "anthropic";
      const selectedModel =
        localStorage.getItem("tenchat-model") || "claude-3.5-sonnet";

      const conversationId = await createConversation({
        title: "New Chat",
        model: selectedModel,
        provider: selectedProvider,
      });
      router.push(`/chat/${conversationId}`);
    } catch (error) {
      console.error("Failed to create conversation:", error);
      setIsCreatingChat(false);
    }
  };

  // Show loading state while checking auth
  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If signed in, show chat interface
  if (isSignedIn) {
    return (
      <div className="flex h-screen flex-col">
        <main className="flex-1 overflow-hidden">
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">Welcome to Ten Chat</h1>
              <p className="text-muted-foreground mb-4">
                Start a new conversation
              </p>
              <Button
                onClick={handleNewChat}
                disabled={isCreatingChat}
                className="inline-flex items-center justify-center gap-2"
              >
                {isCreatingChat ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    Creating...
                  </>
                ) : (
                  "New Chat"
                )}
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Not signed in, will redirect to sign-in
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
        <p className="mt-4 text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  );
}
