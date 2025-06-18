import "~/styles/globals.css";

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { AppSidebar } from "~/components/app-sidebar";
import { AuthenticatedLayout } from "~/components/authenticated-layout";
import { ChatProvider } from "~/components/chat-context";
import { Providers } from "~/components/providers";
import {
  SidebarInset,
  SidebarProvider,
  SidebarRail,
} from "~/components/ui/sidebar";
import { UserSync } from "~/components/user-sync";

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
          <UserSync />
          <ChatProvider>
            <AuthenticatedLayout>{children}</AuthenticatedLayout>
          </ChatProvider>
          <Analytics />
        </Providers>
      </body>
    </html>
  );
}
