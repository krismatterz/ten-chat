import { Sidebar } from "~/components/sidebar";
import { MessageSquare, Zap, Upload, Settings } from "lucide-react";

export default function ChatWelcomePage() {
  return (
    <div className="flex h-screen bg-neutral-50 dark:bg-neutral-900">
      {/* Sidebar */}
      <Sidebar />

      {/* Welcome Area */}
      <div className="flex-1 flex flex-col items-center justify-center bg-neutral-50 dark:bg-neutral-900">
        <div className="max-w-md text-center space-y-6">
          {/* Logo */}
          <div className="flex items-center justify-center w-16 h-16 mx-auto bg-blue-600 rounded-full">
            <MessageSquare className="w-8 h-8 text-white" />
          </div>

          {/* Title */}
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
              Welcome to Ten Chat
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400">
              AI-powered conversations with multiple providers
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 gap-4 w-full">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-white dark:bg-neutral-800 shadow-sm">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  Multiple AI Providers
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Anthropic, OpenAI, Groq, and more
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-white dark:bg-neutral-800 shadow-sm">
              <div className="flex items-center justify-center w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg">
                <Upload className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  File Uploads
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Images, PDFs, and text files
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-white dark:bg-neutral-800 shadow-sm">
              <div className="flex items-center justify-center w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Settings className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  Real-time Sync
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Powered by Convex
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Click the <strong>+</strong> button to start a new conversation
          </p>
        </div>
      </div>
    </div>
  );
}
