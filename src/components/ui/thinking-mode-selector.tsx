"use client";

import { Brain } from "lucide-react";
import { cn } from "~/lib/utils";

interface ThinkingModeSelectorProps {
  reasoningLevel: "low" | "mid" | "high";
  onReasoningChange: (level: "low" | "mid" | "high") => void;
}

export function ThinkingModeSelector({
  reasoningLevel,
  onReasoningChange,
}: ThinkingModeSelectorProps) {
  return (
    <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-background/60 backdrop-blur-md border border-border/30 shadow-sm">
      <Brain className="h-3 w-3 text-purple-600 dark:text-purple-400" />
      <select
        value={reasoningLevel}
        onChange={(e) =>
          onReasoningChange(e.target.value as "low" | "mid" | "high")
        }
        className="text-xs bg-transparent border-none outline-none text-foreground cursor-pointer"
      >
        <option value="low">Low</option>
        <option value="mid">Mid</option>
        <option value="high">High</option>
      </select>
    </div>
  );
}
