"use client";

import { usePathname } from "next/navigation";
import { AuthenticatedLayout } from "./authenticated-layout";

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();

  // Settings routes should not have sidebar (like T3)
  const isSettingsRoute = pathname?.startsWith("/settings");

  if (isSettingsRoute) {
    return <>{children}</>;
  }

  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}
