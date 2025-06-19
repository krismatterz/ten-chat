"use client";

import { Loader2 } from "lucide-react";
import { Suspense } from "react";
import { Settings } from "~/components/settings";
import { SidebarTrigger } from "~/components/ui/sidebar";

// Loading component for the settings page
function SettingsLoading() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex items-center gap-2">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="text-muted-foreground">Loading settings...</span>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center gap-3 p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <SidebarTrigger className="shrink-0" />
        <div className="flex items-center gap-2">
          <h1 className="font-semibold text-foreground">Settings</h1>
          <span className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded-md">
            🚀 Ten Chat
          </span>
        </div>
      </header>
      <main className="flex-1 overflow-hidden">
        <Suspense fallback={<SettingsLoading />}>
          <Settings />
        </Suspense>
      </main>
    </div>
  );
}
