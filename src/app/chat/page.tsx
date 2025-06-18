import { Sidebar } from "~/components/sidebar";
import { MessageSquare, Zap, Upload, Settings } from "lucide-react";

export default function ChatWelcomePage() {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar />

      {/* Welcome Area */}
      <div className="flex-1 flex flex-col items-center justify-center bg-background">
        <div className="max-w-md text-center space-y-6">
          {/* Logo */}
          <div className="flex items-center justify-center w-16 h-16 mx-auto bg-primary rounded-full">
            <MessageSquare className="w-8 h-8 text-primary-foreground" />
          </div>

          {/* Title */}
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Welcome to Ten Chat
            </h1>
            <p className="text-muted-foreground">
              AI-powered conversations with multiple providers
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 gap-4 w-full">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-card border shadow-sm">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-card-foreground">
                  Multiple AI Providers
                </p>
                <p className="text-xs text-muted-foreground">
                  Anthropic, OpenAI, Groq, and more
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-card border shadow-sm">
              <div className="flex items-center justify-center w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg">
                <Upload className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-card-foreground">
                  File Uploads
                </p>
                <p className="text-xs text-muted-foreground">
                  Images, PDFs, and text files
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-card border shadow-sm">
              <div className="flex items-center justify-center w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Settings className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-card-foreground">
                  Real-time Sync
                </p>
                <p className="text-xs text-muted-foreground">
                  Powered by Convex
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <p className="text-sm text-muted-foreground">
            Click the <strong>+</strong> button to start a new conversation
          </p>
        </div>
      </div>
    </div>
  );
}
