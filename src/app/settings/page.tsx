import { Settings } from "../../components/settings";
import { Sidebar } from "~/components/sidebar";

export default function SettingsPage() {
  return (
    <div className="flex h-screen bg-neutral-50 dark:bg-neutral-900">
      {/* Sidebar */}
      <Sidebar />

      {/* Settings Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Settings />
      </div>
    </div>
  );
}
