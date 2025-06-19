"use client";

import { ArrowLeft } from "lucide-react";
import { Suspense } from "react";
import Link from "next/link";
import { Settings } from "~/components/settings";
import { Button } from "~/components/ui/button";

// Loading component for the settings page
function SettingsLoading() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex items-center gap-2">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="text-muted-foreground">Loading settings...</span>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex items-center gap-3 p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/chat/new" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Chat
          </Link>
        </Button>
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
