import { redirect } from "next/navigation";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";

export default async function HomePage() {
  const user = await currentUser();

  if (user) {
    redirect("/chat");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <div className="text-center">
          <h1 className="font-extrabold text-5xl tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-[5rem]">
            Ten <span className="text-blue-600">Chat</span>
          </h1>
          <p className="mt-4 text-xl text-neutral-600 dark:text-neutral-400">
            Modern AI-powered conversations
          </p>
        </div>

        <div className="flex gap-4">
          <SignInButton mode="modal">
            <button
              type="button"
              className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white shadow-lg transition-colors hover:bg-blue-700"
            >
              Sign In
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button
              type="button"
              className="rounded-lg border border-neutral-300 px-6 py-3 font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              Sign Up
            </button>
          </SignUpButton>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-8">
          <div className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/50 p-6 shadow-lg backdrop-blur-sm dark:bg-neutral-800/50">
            <h3 className="font-bold text-2xl text-neutral-900 dark:text-neutral-100">
              AI-Powered 🤖
            </h3>
            <div className="text-lg text-neutral-600 dark:text-neutral-400">
              Chat with multiple AI models including Anthropic Claude, OpenAI
              GPT, and Groq.
            </div>
          </div>
          <div className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/50 p-6 shadow-lg backdrop-blur-sm dark:bg-neutral-800/50">
            <h3 className="font-bold text-2xl text-neutral-900 dark:text-neutral-100">
              Real-time ⚡
            </h3>
            <div className="text-lg text-neutral-600 dark:text-neutral-400">
              Experience instant messaging with real-time synchronization across
              all your devices.
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
