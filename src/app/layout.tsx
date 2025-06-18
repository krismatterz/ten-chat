import "~/styles/globals.css";

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "~/components/providers";
import { ChatProvider } from "~/components/chat-context";
import { SidebarProvider, SidebarInset } from "~/components/ui/sidebar";
import { AppSidebar } from "~/components/app-sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Ten Chat",
  description: "AI-powered chat application",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <ChatProvider>
            <SidebarProvider>
              <AppSidebar />
              <SidebarInset>{children}</SidebarInset>
            </SidebarProvider>
          </ChatProvider>
        </Providers>
      </body>
    </html>
  );
}
