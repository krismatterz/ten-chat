import { redirect } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

export default function ChatPage() {
  // Generate a new chat ID and redirect to it
  const chatId = uuidv4();
  redirect(`/chat/${chatId}`);
}
