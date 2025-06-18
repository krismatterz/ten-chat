import { Sidebar } from "~/components/sidebar";
import { Chat } from "~/components/chat";

export default function HomePage() {
  return (
    <div className="flex h-screen gradient-modern-light dark:gradient-modern-dark">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Chat chatId="new" />
      </div>
    </div>
  );
}
