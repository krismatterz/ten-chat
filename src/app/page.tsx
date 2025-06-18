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
      if (isSignedIn) {
        router.push("/chat");
      } else {
        router.push("/sign-in");
      }
    }
  }, [isSignedIn, isLoaded, router]);

  // Show loading state while checking auth
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
