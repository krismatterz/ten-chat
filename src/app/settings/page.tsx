"use client";

import { Settings } from "../../components/settings";
import { SidebarTrigger } from "~/components/ui/sidebar";

export default function SettingsPage() {
  return (
    <div className="flex h-screen flex-col">
      <div className="flex items-center gap-2 p-4 border-b">
        <SidebarTrigger />
        <h1 className="font-semibold">Settings</h1>
      </div>
      <Settings />
    </div>
  );
}
