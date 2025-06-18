"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "./button";
import { cn } from "~/lib/utils";

interface ThemeToggleProps {
  collapsed?: boolean;
  showIcons?: boolean;
  align?: "start" | "center" | "end";
}

export function ThemeToggle({
  collapsed = false,
  showIcons = true,
}: ThemeToggleProps) {
  const { setTheme, theme } = useTheme();

  return (
    <Button
      variant="ghost"
      size={collapsed ? "icon" : "default"}
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className={cn(
        "hover:bg-accent",
        collapsed ? "w-9 h-9" : "w-full justify-start"
      )}
    >
      <div className="flex items-center gap-2">
        <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        {!collapsed && (
          <span className="text-sm">
            {theme === "light" ? "Dark" : "Light"} Mode
          </span>
        )}
      </div>
    </Button>
  );
}
