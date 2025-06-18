import { redirect } from "next/navigation";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";

export default async function HomePage() {
  const user = await currentUser();

  if (user) {
    redirect("/chat");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-muted/20">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <div className="text-center">
          <h1 className="font-extrabold text-5xl tracking-tight text-foreground sm:text-[5rem]">
            Ten <span className="text-primary">Chat</span>
          </h1>
          <p className="mt-4 text-xl text-muted-foreground">
            Modern AI-powered conversations
          </p>
        </div>

        <div className="flex gap-4">
          <SignInButton mode="modal">
            <button
              type="button"
              className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-lg transition-colors hover:bg-primary/90"
            >
              Sign In
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button
              type="button"
              className="rounded-lg border border-input px-6 py-3 font-semibold text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Sign Up
            </button>
          </SignUpButton>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-8">
          <div className="flex max-w-xs flex-col gap-4 rounded-xl bg-card/50 p-6 shadow-lg backdrop-blur-sm border">
            <h3 className="font-bold text-2xl text-card-foreground">
              AI-Powered 🤖
            </h3>
            <div className="text-lg text-muted-foreground">
              Chat with multiple AI models including Anthropic Claude, OpenAI
              GPT, and Groq.
            </div>
          </div>
          <div className="flex max-w-xs flex-col gap-4 rounded-xl bg-card/50 p-6 shadow-lg backdrop-blur-sm border">
            <h3 className="font-bold text-2xl text-card-foreground">
              Real-time ⚡
            </h3>
            <div className="text-lg text-muted-foreground">
              Experience instant messaging with real-time synchronization across
              all your devices.
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
