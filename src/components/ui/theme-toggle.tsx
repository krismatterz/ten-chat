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

export function ThemeToggle({ collapsed = false }: ThemeToggleProps) {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size={collapsed ? "icon" : "default"}
        className={cn(
          "hover:bg-accent",
          collapsed ? "w-9 h-9" : "w-full justify-start"
        )}
        disabled
      >
        <div className="flex items-center gap-2">
          <Sun className="h-4 w-4" />
          {!collapsed && <span className="text-sm">Theme</span>}
        </div>
      </Button>
    );
  }

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
        {!collapsed && <span className="text-sm">Toggle theme</span>}
      </div>
    </Button>
  );
}
