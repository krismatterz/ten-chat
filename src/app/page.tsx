"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

export default function HomePage() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (isLoaded && !hasRedirected.current) {
      hasRedirected.current = true;
      if (!isSignedIn) {
        router.push("/sign-in");
      }
      // Don't redirect signed-in users, show chat interface here
    }
  }, [isSignedIn, isLoaded, router]);

  // Show loading state while checking auth
  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
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
              <a
                href="/chat/new"
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
              >
                New Chat
              </a>
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  );
}
