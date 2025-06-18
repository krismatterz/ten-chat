import { Chat } from "~/components/chat";
import { Sidebar } from "~/components/sidebar";

interface ChatPageProps {
  params: {
    id: string;
  };
}

export default function ChatPage({ params }: ChatPageProps) {
  return (
    <div className="flex h-screen bg-neutral-50 dark:bg-neutral-900">
      {/* Sidebar */}
      <Sidebar currentChatId={params.id} />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Chat chatId={params.id} />
      </div>
    </div>
  );
}
