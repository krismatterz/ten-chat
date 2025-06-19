"use client";

import { useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { AuthenticatedLayout } from "./authenticated-layout";

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  const { isLoaded, isSignedIn } = useUser();

  // Settings routes should not have sidebar but still need auth
  const isSettingsRoute = pathname?.startsWith("/settings");

  if (isSettingsRoute) {
    // Show loading state while Clerk is initializing
    if (!isLoaded) {
      return (
        <div className="flex h-screen items-center justify-center">
          <div className="flex items-center space-x-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="text-muted-foreground">Loading...</span>
          </div>
        </div>
      );
    }

    // Settings routes need authentication
    if (!isSignedIn) {
      // This will be handled by middleware redirect
      return null;
    }

    return <>{children}</>;
  }

  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}
