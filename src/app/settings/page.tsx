"use client";

import { Settings } from "~/components/settings";
import { SidebarTrigger } from "~/components/ui/sidebar";

export default function SettingsPage() {
  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center gap-3 p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <SidebarTrigger className="shrink-0" />
        <div className="flex items-center gap-2">
          <h1 className="font-semibold text-foreground">Settings</h1>
          <span className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded-md">
            Configure your preferences
          </span>
        </div>
      </header>
      <main className="flex-1 overflow-hidden p-6">
        <Settings />
      </main>
    </div>
  );
}
