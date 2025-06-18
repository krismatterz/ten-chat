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
  Crown,
  AlertTriangle,
} from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "~/lib/utils";
import { AI_PROVIDERS, type AIProvider } from "~/lib/providers";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
import { Input } from "./ui/input";
import { Separator } from "./ui/separator";

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
  "o3-mini",
  "o3",
  "claude-4-sonnet",
  "claude-4-sonnet-reasoning",
  "deepseek-r1-0528",
];

// Model capabilities mapping
const MODEL_CAPABILITIES: Record<string, string[]> = {
  "claude-3-5-sonnet-20241022": ["vision", "web", "docs", "reasoning"],
  "claude-3-5-sonnet-20240620": ["vision", "web", "docs"],
  "claude-3-opus-20240229": ["vision", "web", "docs", "reasoning"],
  "claude-4-sonnet": ["vision", "web", "docs", "reasoning"],
  "claude-4-sonnet-reasoning": ["vision", "web", "docs", "reasoning"],
  "gpt-4o": ["vision", "web"],
  "gpt-4o-mini": ["vision", "reasoning"],
  "gpt-4": ["web", "docs"],
  "gpt-imagegen": ["vision"],
  "gpt-4.1": ["vision"],
  "o4-mini": ["reasoning"],
  o3: ["reasoning"],
  "o3-mini": ["reasoning"],
  "llama-3.3-70b-versatile": ["reasoning"],
  "gemini-pro": ["vision", "web"],
  "gemini-flash": ["vision", "web", "docs"],
  "gemini-2.5-flash": ["vision", "web", "docs"],
  "gemini-2.5-flash-thinking": ["vision", "web", "docs", "reasoning"],
  "gemini-2.5-pro": ["vision", "web", "docs", "reasoning"],
  "gemini-2.5-flash-lite": ["vision", "web"],
  "gemini-2.5-flash-lite-thinking": ["vision", "web", "reasoning"],
  "deepseek-r1-0528": ["reasoning"],
};

// Model status mapping
const MODEL_STATUS: Record<string, "new" | "degraded"> = {
  "claude-4-sonnet": "degraded",
  "claude-4-sonnet-reasoning": "degraded",
  "gemini-2.5-flash-lite": "new",
  "gemini-2.5-flash-lite-thinking": "new",
  "llama-4-opus": "degraded",
};

interface ModelData {
  id: string;
  provider: string;
  providerName: string;
  displayName: string;
  capabilities: string[];
  status?: "new" | "degraded";
  isFavorited: boolean;
}

const getProviderIcon = (providerId: string) => {
  switch (providerId) {
    case "anthropic":
      return <span className="text-sm font-bold text-orange-500">AI</span>;
    case "openai":
      return (
        <div className="w-4 h-4 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-white" />
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
    if (model.includes("claude-4-sonnet-reasoning"))
      return "Claude 4 Sonnet (Reasoning)";
    if (model.includes("claude-4-sonnet")) return "Claude 4 Sonnet";
  }
  if (provider === "openai") {
    if (model.includes("gpt-imagegen")) return "GPT ImageGen";
    if (model.includes("gpt-4o-mini")) return "GPT-4o Mini";
    if (model.includes("gpt-4o")) return "GPT-4o";
    if (model.includes("gpt-4.1")) return "GPT-4.1";
    if (model.includes("gpt-4")) return "GPT-4";
    if (model.includes("o4-mini")) return "o4-mini";
    if (model.includes("o3-mini")) return "o3-mini";
    if (model.includes("o3")) return "o3";
  }
  if (provider === "google") {
    if (model.includes("gemini-2.5-flash-lite-thinking"))
      return "Gemini 2.5 Flash Lite (Thinking)";
    if (model.includes("gemini-2.5-flash-lite")) return "Gemini 2.5 Flash Lite";
    if (model.includes("gemini-2.5-flash-thinking"))
      return "Gemini 2.5 Flash (Thinking)";
    if (model.includes("gemini-2.5-flash")) return "Gemini 2.5 Flash";
    if (model.includes("gemini-2.5-pro")) return "Gemini 2.5 Pro";
    if (model.includes("gemini-pro")) return "Gemini Pro";
  }
  if (provider === "groq") {
    if (model.includes("llama")) return "Llama 3.3 70B";
  }
  if (provider === "deepseek") {
    if (model.includes("deepseek-r1")) return "DeepSeek R1 (0528)";
  }

  // Fallback formatting
  return model
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const getModelDisplayNameShort = (model: string) => {
  if (model.includes("claude-3-5-sonnet-20241022")) return "20241022";
  if (model.includes("claude-3-5-sonnet-20240620")) return "Sonnet";
  if (model.includes("claude-3-opus")) return "Opus";
  if (model.includes("gpt-4o-mini")) return "4o Mini";
  if (model.includes("gpt-4o")) return "4o";
  if (model.includes("o3-mini")) return "o3 Mini";
  if (model.includes("o3")) return "o3";
  return model.split("-").slice(-1)[0] || model;
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
  const allModels = useMemo((): ModelData[] => {
    return AI_PROVIDERS.flatMap((provider) =>
      provider.models.map(
        (model): ModelData => ({
          id: model,
          provider: provider.id,
          providerName: provider.name,
          displayName: getModelDisplayName(model, provider.id),
          capabilities: MODEL_CAPABILITIES[model] || [],
          status: MODEL_STATUS[model],
          isFavorited: favorites.includes(model),
        })
      )
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
    const capabilities = MODEL_CAPABILITIES[model] || [];
    return capabilities.includes("reasoning");
  };

  const renderModelRow = (model: ModelData) => {
    const isSelected =
      selectedProvider === model.provider && selectedModel === model.id;

    return (
      <div
        key={`${model.provider}-${model.id}`}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted rounded-md transition-colors group cursor-pointer",
          isSelected && "bg-muted"
        )}
        onClick={() => handleModelSelect(model.provider, model.id)}
      >
        {/* Provider Icon */}
        <div className="flex-shrink-0">{getProviderIcon(model.provider)}</div>

        {/* Model Info */}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">
            {model.displayName}
          </div>
        </div>

        {/* Status Badge */}
        {model.status && (
          <div
            className={cn(
              "px-1.5 py-0.5 text-xs font-medium rounded",
              model.status === "degraded" &&
                "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 flex items-center gap-1",
              model.status === "new" &&
                "bg-green-500/20 text-green-600 dark:text-green-400"
            )}
          >
            {model.status === "degraded" && (
              <AlertTriangle className="w-3 h-3" />
            )}
            {model.status === "degraded" ? "" : "NEW"}
          </div>
        )}

        {/* Capabilities */}
        <div className="flex items-center gap-1">
          {model.capabilities.map((capability) => (
            <div
              key={capability}
              className="flex items-center justify-center w-5 h-5 rounded bg-muted text-muted-foreground"
              title={capability}
            >
              {getCapabilityIcon(capability)}
            </div>
          ))}
        </div>

        {/* Favorite - Now a separate clickable area */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(model.id);
          }}
          className={cn(
            "p-1 rounded transition-colors hover:bg-background",
            "opacity-0 group-hover:opacity-100",
            model.isFavorited && "opacity-100"
          )}
          aria-label={
            model.isFavorited ? "Remove from favorites" : "Add to favorites"
          }
        >
          <Heart
            className={cn(
              "h-3 w-3 text-red-500",
              model.isFavorited && "fill-current"
            )}
          />
        </button>
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
          className="h-8 px-3 text-xs gap-2 border"
        >
          <div className="flex items-center gap-1.5">
            {getProviderIcon(selectedProvider)}
            <span className="font-medium">{displayName}</span>
          </div>
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
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown */}
            <div className="absolute top-full left-0 z-50 mt-2 w-96 bg-background border rounded-lg shadow-lg max-h-[70vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-medium text-sm">Select AI Model</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="h-6 w-6"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>

              {/* Search */}
              <div className="p-3 border-b">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search models..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 text-xs h-8"
                  />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                {/* Favorites Section */}
                {organizedModels.favorites.length > 0 && (
                  <div className="p-3">
                    <div className="flex items-center gap-2 mb-2 px-1">
                      <Heart className="h-3 w-3 text-red-500 fill-current" />
                      <span className="text-xs font-medium text-muted-foreground">
                        Favorites
                      </span>
                    </div>
                    <div className="space-y-1">
                      {organizedModels.favorites.map(renderModelRow)}
                    </div>
                  </div>
                )}

                {/* Separator */}
                {organizedModels.favorites.length > 0 &&
                  organizedModels.others.length > 0 && (
                    <Separator className="mx-3" />
                  )}

                {/* Others Section */}
                {organizedModels.others.length > 0 && (
                  <div className="p-3">
                    <div className="flex items-center gap-2 mb-2 px-1">
                      <Bot className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground">
                        All Models
                      </span>
                    </div>
                    <div className="space-y-1">
                      {organizedModels.others.map(renderModelRow)}
                    </div>
                  </div>
                )}

                {/* No Results */}
                {organizedModels.favorites.length === 0 &&
                  organizedModels.others.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-24 text-muted-foreground p-4">
                      <Search className="h-6 w-6 mb-2" />
                      <p className="text-xs">No models found</p>
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
