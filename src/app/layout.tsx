import "~/styles/globals.css";

import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ChatProvider } from "~/components/chat-context";
import { ConditionalLayout } from "~/components/conditional-layout";
import { Providers } from "~/components/providers";
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
            <ConditionalLayout>{children}</ConditionalLayout>
          </ChatProvider>
          <Analytics />
        </Providers>
      </body>
    </html>
  );
}
