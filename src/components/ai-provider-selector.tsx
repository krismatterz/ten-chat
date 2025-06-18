"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown,
  Zap,
  Heart,
  Brain,
  Star,
  Search,
  Eye,
  Globe,
  FileText,
  X,
  Sparkles,
  Bot,
  Filter,
} from "lucide-react";
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
const USER_FAVORITES = [
  "claude-3-5-sonnet-20241022",
  "claude-3-5-sonnet-20240620",
  "claude-3-opus-20240229",
  "gpt-4o",
  "gpt-4o-mini",
];

// Model capabilities mapping
const MODEL_CAPABILITIES = {
  "claude-3-5-sonnet-20241022": ["vision", "web", "docs", "reasoning"],
  "claude-3-5-sonnet-20240620": ["vision", "web", "docs"],
  "claude-3-opus-20240229": ["vision", "web", "docs", "reasoning"],
  "gpt-4o": ["vision", "web"],
  "gpt-4o-mini": ["vision", "reasoning"],
  "gpt-4": ["web", "docs"],
  "llama-3.3-70b-versatile": ["reasoning"],
  "gemini-pro": ["vision", "web"],
  "gemini-flash": ["vision", "web", "docs"],
};

// Model status mapping
const MODEL_STATUS = {
  "claude-4-sonnet": "degraded",
  "claude-4-sonnet-reasoning": "degraded",
  "gemini-2.5-flash-lite": "new",
  "gemini-2.5-flash-lite-thinking": "new",
};

const getProviderIcon = (providerId: string) => {
  switch (providerId) {
    case "anthropic":
      return <span className="text-lg font-bold text-orange-500">AI</span>;
    case "openai":
      return (
        <div className="w-4 h-4 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-white"></div>
        </div>
      );
    case "google":
      return <Sparkles className="w-4 h-4 text-blue-500" />;
    case "groq":
      return <Zap className="w-4 h-4 text-orange-500" />;
    default:
      return <Bot className="w-4 h-4 text-muted-foreground" />;
  }
};

const getCapabilityIcon = (capability: string) => {
  switch (capability) {
    case "vision":
      return <Eye className="w-3 h-3" />;
    case "web":
      return <Globe className="w-3 h-3" />;
    case "docs":
      return <FileText className="w-3 h-3" />;
    case "reasoning":
      return <Brain className="w-3 h-3" />;
    default:
      return null;
  }
};

const getModelDisplayName = (model: string, provider: string) => {
  if (provider === "anthropic") {
    if (model.includes("claude-3-5-sonnet-20241022"))
      return "Claude 3.5 Sonnet";
    if (model.includes("claude-3-5-sonnet-20240620"))
      return "Claude 3.5 Sonnet (June)";
    if (model.includes("claude-3-opus")) return "Claude 3 Opus";
    if (model.includes("claude-4-sonnet")) return "Claude 4 Sonnet";
  }
  if (provider === "openai") {
    if (model.includes("gpt-4o-mini")) return "GPT-4o Mini";
    if (model.includes("gpt-4o")) return "GPT-4o";
    if (model.includes("gpt-4")) return "GPT-4";
    if (model.includes("o3-mini")) return "o3-mini";
    if (model.includes("o3")) return "o3";
  }
  if (provider === "google") {
    if (model.includes("gemini-2.5-flash")) return "Gemini 2.5 Flash";
    if (model.includes("gemini-pro")) return "Gemini Pro";
  }

  // Fallback formatting
  return model
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export function AIProviderSelector({
  selectedProvider,
  selectedModel,
  onProviderChange,
  reasoningLevel = "mid",
  onReasoningChange,
}: AIProviderSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavorites] = useState<string[]>(USER_FAVORITES);

  const currentProvider = AI_PROVIDERS.find((p) => p.id === selectedProvider);
  const displayName = currentProvider?.name || "Select AI";

  // Flatten all models with provider info
  const allModels = useMemo(() => {
    return AI_PROVIDERS.flatMap((provider) =>
      provider.models.map((model) => ({
        id: model,
        provider: provider.id,
        providerName: provider.name,
        displayName: getModelDisplayName(model, provider.id),
        capabilities:
          MODEL_CAPABILITIES[model as keyof typeof MODEL_CAPABILITIES] || [],
        status: MODEL_STATUS[model as keyof typeof MODEL_STATUS],
        isFavorited: favorites.includes(model),
      }))
    );
  }, [favorites]);

  // Filter and organize models
  const organizedModels = useMemo(() => {
    const filtered = allModels.filter(
      (model) =>
        model.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        model.providerName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const favoriteModels = filtered.filter((model) => model.isFavorited);
    const otherModels = filtered.filter((model) => !model.isFavorited);

    return {
      favorites: favoriteModels,
      others: otherModels,
    };
  }, [allModels, searchQuery]);

  const toggleFavorite = (modelId: string) => {
    setFavorites((prev) =>
      prev.includes(modelId)
        ? prev.filter((id) => id !== modelId)
        : [...prev, modelId]
    );
  };

  const handleModelSelect = (provider: string, model: string) => {
    onProviderChange(provider, model);
    setIsOpen(false);
  };

  const supportsReasoning = (model: string) => {
    const capabilities =
      MODEL_CAPABILITIES[model as keyof typeof MODEL_CAPABILITIES] || [];
    return capabilities.includes("reasoning");
  };

  const renderModelCard = (model: any) => {
    const isSelected =
      selectedProvider === model.provider && selectedModel === model.id;

    return (
      <div
        key={`${model.provider}-${model.id}`}
        onClick={() => handleModelSelect(model.provider, model.id)}
        className={cn(
          "group relative p-4 rounded-lg border bg-card hover:bg-accent cursor-pointer transition-all duration-200",
          isSelected && "ring-2 ring-primary bg-accent"
        )}
      >
        {/* Status Badge */}
        {model.status && (
          <div
            className={cn(
              "absolute top-2 right-2 px-2 py-1 text-xs font-medium rounded-md",
              model.status === "degraded" &&
                "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400",
              model.status === "new" &&
                "bg-green-500/20 text-green-600 dark:text-green-400"
            )}
          >
            {model.status === "degraded" ? "Degraded" : "NEW"}
          </div>
        )}

        <div className="flex items-start gap-3">
          {/* Provider Icon */}
          <div className="flex-shrink-0 mt-1">
            {getProviderIcon(model.provider)}
          </div>

          <div className="flex-1 min-w-0">
            {/* Model Name */}
            <div className="font-medium text-sm mb-1 truncate">
              {model.displayName}
            </div>

            {/* Provider Name */}
            <div className="text-xs text-muted-foreground mb-2 capitalize">
              {model.providerName}
            </div>

            {/* Capabilities */}
            <div className="flex items-center gap-2">
              {model.capabilities.map((capability: string) => (
                <div
                  key={capability}
                  className="flex items-center justify-center w-6 h-6 rounded bg-secondary text-muted-foreground"
                  title={capability}
                >
                  {getCapabilityIcon(capability)}
                </div>
              ))}
            </div>
          </div>

          {/* Favorite Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(model.id);
            }}
            className={cn(
              "opacity-0 group-hover:opacity-100 p-1 rounded transition-all",
              model.isFavorited && "opacity-100"
            )}
          >
            <Heart
              className={cn(
                "h-3 w-3 text-red-500",
                model.isFavorited && "fill-current"
              )}
            />
          </button>
        </div>
      </div>
    );
  };

  const getModelDisplayNameShort = (model: string) => {
    if (model.includes("claude-3-5-sonnet-20241022")) return "20241022";
    if (model.includes("claude-3-5-sonnet-20240620")) return "Sonnet";
    if (model.includes("claude-3-opus")) return "Opus";
    if (model.includes("gpt-4o-mini")) return "4o Mini";
    if (model.includes("gpt-4o")) return "4o";
    return model.split("-").slice(-1)[0] || model;
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
            {getModelDisplayNameShort(selectedModel)}
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
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />

            {/* Modal */}
            <div className="fixed inset-4 z-50 bg-background/95 backdrop-blur-lg border rounded-2xl shadow-2xl max-w-4xl mx-auto max-h-[80vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-lg font-semibold">Select AI Model</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Search */}
              <div className="p-6 border-b">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search models..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-secondary rounded-lg border-0 text-sm placeholder-muted-foreground focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Favorites Section */}
                {organizedModels.favorites.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Heart className="h-4 w-4 text-red-500" />
                      <h3 className="font-medium text-sm">Favorites</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {organizedModels.favorites.map(renderModelCard)}
                    </div>
                  </div>
                )}

                {/* Others Section */}
                {organizedModels.others.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Filter className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-medium text-sm">Others</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {organizedModels.others.map(renderModelCard)}
                    </div>
                  </div>
                )}

                {/* No Results */}
                {organizedModels.favorites.length === 0 &&
                  organizedModels.others.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                      <Search className="h-8 w-8 mb-2" />
                      <p className="text-sm">No models found</p>
                      <p className="text-xs">Try a different search term</p>
                    </div>
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
