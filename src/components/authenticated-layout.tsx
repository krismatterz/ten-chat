"use client";

import { useUser } from "@clerk/nextjs";
import { AppSidebar } from "~/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarRail,
} from "~/components/ui/sidebar";

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const { isLoaded, isSignedIn } = useUser();

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

  // If user is not signed in, render children without sidebar
  if (!isSignedIn) {
    return <>{children}</>;
  }

  // If user is signed in, render with sidebar
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarRail />
      <SidebarInset className="transition-all duration-300 ease-in-out">
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
