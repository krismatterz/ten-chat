"use client";

import { useState, useMemo } from "react";
import { ChevronDown, Zap, Heart, Brain, Star } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "~/lib/utils";
import { AI_PROVIDERS, type AIProvider } from "~/lib/providers";

interface AIProviderSelectorProps {
  selectedProvider: string;
  selectedModel: string;
  onProviderChange: (provider: string, model: string) => void;
  reasoningLevel?: "low" | "mid" | "high";
  onReasoningChange?: (level: "low" | "mid" | "high") => void;
}

// Mock user favorites - in real app this would come from user preferences
const USER_FAVORITES = ["anthropic", "openai", "openrouter"];

export function AIProviderSelector({
  selectedProvider,
  selectedModel,
  onProviderChange,
  reasoningLevel = "mid",
  onReasoningChange,
}: AIProviderSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(USER_FAVORITES);

  const currentProvider = AI_PROVIDERS.find((p) => p.id === selectedProvider);
  const displayName = currentProvider?.name || "Select AI";

  // Organize providers by favorites, recent releases, etc.
  const organizedProviders = useMemo(() => {
    const favoriteProviders = AI_PROVIDERS.filter((p) =>
      favorites.includes(p.id)
    );
    const recentProviders = AI_PROVIDERS.filter(
      (p) => p.id === "openai" || p.id === "anthropic" || p.id === "openrouter"
    );
    const otherProviders = AI_PROVIDERS.filter(
      (p) =>
        !favorites.includes(p.id) && !recentProviders.some((r) => r.id === p.id)
    );

    return {
      favorites: favoriteProviders,
      recent: recentProviders.filter((p) => !favorites.includes(p.id)),
      others: otherProviders,
    };
  }, [favorites]);

  const toggleFavorite = (providerId: string) => {
    setFavorites((prev) =>
      prev.includes(providerId)
        ? prev.filter((id) => id !== providerId)
        : [...prev, providerId]
    );
  };

  const getModelDisplayName = (model: string) => {
    // Better model name formatting
    if (model.includes("/")) {
      return model.split("/")[1] || model;
    }
    return model.split("-").slice(-1)[0] || model;
  };

  const supportsReasoning = (model: string) => {
    // Models that support reasoning modes
    const reasoningModels = [
      "claude-3-7-sonnet",
      "claude-4-sonnet",
      "claude-4-opus",
      "o3-mini",
      "o3",
      "o4-mini",
      "deepseek-r1",
      "grok-3",
      "sonar-reasoning",
    ];
    return reasoningModels.some((m) => model.toLowerCase().includes(m));
  };

  const renderProviderSection = (
    providers: AIProvider[],
    title: string,
    icon?: React.ReactNode
  ) => {
    if (providers.length === 0) return null;

    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-muted-foreground">
          {icon}
          {title}
        </div>
        {providers.map((provider) => (
          <div key={provider.id} className="space-y-1">
            {provider.models.map((model) => (
              <div
                key={model}
                className={cn(
                  "group flex items-center justify-between w-full px-3 py-2 text-left text-sm rounded-md transition-colors hover:bg-accent",
                  selectedProvider === provider.id && selectedModel === model
                    ? "bg-secondary"
                    : ""
                )}
              >
                <button
                  onClick={() => {
                    onProviderChange(provider.id, model);
                    setIsOpen(false);
                  }}
                  className="flex-1 text-left"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {getModelDisplayName(model)}
                    </span>
                    {supportsReasoning(model) && (
                      <Brain className="h-3 w-3 text-purple-500" />
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {provider.name}
                  </div>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(provider.id);
                  }}
                  className={cn(
                    "opacity-0 group-hover:opacity-100 p-1 rounded transition-all",
                    favorites.includes(provider.id)
                      ? "opacity-100 text-red-500"
                      : "text-muted-foreground hover:text-red-500"
                  )}
                >
                  <Heart
                    className={cn(
                      "h-3 w-3",
                      favorites.includes(provider.id) && "fill-current"
                    )}
                  />
                </button>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex items-center gap-2">
      {/* AI Provider Selector */}
      <div className="relative">
        <Button
          variant="outline"
          onClick={() => setIsOpen(!isOpen)}
          className="h-8 px-3 text-xs gap-2 bg-background/50 backdrop-blur-sm border-border/50"
        >
          <Zap className="h-3 w-3" />
          <span className="font-medium">{displayName}</span>
          <span className="text-muted-foreground">•</span>
          <span className="text-muted-foreground text-xs">
            {getModelDisplayName(selectedModel)}
          </span>
          {supportsReasoning(selectedModel) && (
            <Brain className="h-3 w-3 text-purple-500" />
          )}
          <ChevronDown
            className={cn(
              "h-3 w-3 transition-transform",
              isOpen && "rotate-180"
            )}
          />
        </Button>

        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown */}
            <div className="absolute top-full mt-1 left-0 z-20 min-w-[320px] max-h-[400px] overflow-y-auto rounded-lg border bg-background/95 backdrop-blur-sm shadow-lg">
              <div className="p-2 space-y-3">
                {renderProviderSection(
                  organizedProviders.favorites,
                  "Favorites",
                  <Heart className="h-3 w-3" />
                )}
                {renderProviderSection(
                  organizedProviders.recent,
                  "Latest Releases",
                  <Star className="h-3 w-3" />
                )}
                {renderProviderSection(
                  organizedProviders.others,
                  "All Providers"
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Reasoning Level Control */}
      {supportsReasoning(selectedModel) && onReasoningChange && (
        <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
          <Brain className="h-3 w-3 text-purple-600 dark:text-purple-400" />
          <select
            value={reasoningLevel}
            onChange={(e) =>
              onReasoningChange(e.target.value as "low" | "mid" | "high")
            }
            className="text-xs bg-transparent border-none outline-none text-purple-700 dark:text-purple-300"
          >
            <option value="low">Low</option>
            <option value="mid">Mid</option>
            <option value="high">High</option>
          </select>
        </div>
      )}
    </div>
  );
}
