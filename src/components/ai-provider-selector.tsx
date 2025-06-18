"use client";

import {
  AlertTriangle,
  Bot,
  Brain,
  Check,
  ChevronDown,
  ChevronUp,
  Eye,
  FileText,
  Globe,
  Heart,
  Search,
  Sparkles,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { type AIProvider, AI_PROVIDERS } from "~/lib/providers";
import { cn } from "~/lib/utils";
import { Button } from "./ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { ThinkingModeSelector } from "./ui/thinking-mode-selector";

interface AIProviderSelectorProps {
  selectedProvider: string;
  selectedModel: string;
  onProviderChange: (provider: string, model: string) => void;
  reasoningLevel?: "low" | "mid" | "high";
  onReasoningChange?: (level: "low" | "mid" | "high") => void;
}

// Mock user favorites - in real app this would come from user preferences
const USER_FAVORITES = [
  "claude-3.5-sonnet",
  "claude-3-7-sonnet-20250219",
  "claude-4-sonnet-20250522",
  "gpt-4o",
  "gpt-4.1-2025-04-14",
  "o3-mini-2025-01-31",
  "o3-2025-04-16",
  "sonar-pro",
];

// Updated model capabilities mapping
const MODEL_CAPABILITIES: Record<string, string[]> = {
  "gpt-4o": ["vision", "web"],
  "gpt-4.1-2025-04-14": ["vision", "web", "docs"],
  "o4-mini-2025-04-16": ["reasoning"],
  "o4-mini-high-2025-04-16": ["reasoning"],
  "o3-mini-2025-01-31": ["reasoning"],
  "o3-2025-04-16": ["reasoning"],
  "o3-pro-2025-06-10": ["reasoning"],
  "gpt-4.5-preview-2025-02-27": ["vision", "web", "docs"],
  "gemini-2.5-flash-lite-preview-06-17": ["vision", "web"],
  "gemini-2.5-flash": ["vision", "web", "docs"],
  "gemini-2.5-pro": ["vision", "web", "docs", "reasoning"],
  "claude-3.5-sonnet": ["vision", "web", "docs", "reasoning"],
  "claude-3-7-sonnet-20250219": ["vision", "web", "docs", "reasoning"],
  "claude-3-7-sonnet-20250219:thinking": ["vision", "web", "docs", "reasoning"],
  "claude-4-sonnet-20250522": ["vision", "web", "docs", "reasoning"],
  "claude-4-opus-20250522": ["vision", "web", "docs", "reasoning"],
  "deepseek-r1-0528:free": ["reasoning"],
  "grok-3-mini-beta": ["web"],
  "grok-3-beta": ["web", "reasoning"],
  "qwen3-14b-04-28:free": ["web"],
  "qwen3-235b-a22b-04-28": ["web", "docs"],
  sonar: ["web"],
  "sonar-pro": ["web", "reasoning"],
  "sonar-reasoning-pro": ["web", "reasoning"],
  "sonar-deep-research": ["web", "docs", "reasoning"],
  "llama-3.3-70b-instruct": ["reasoning"],
  // OpenRouter model capabilities (with full paths)
  "openai/gpt-4o": ["vision", "web"],
  "openai/gpt-4.1-2025-04-14": ["vision", "web", "docs"],
  "openai/o4-mini-2025-04-16": ["reasoning"],
  "openai/o4-mini-high-2025-04-16": ["reasoning"],
  "openai/o3-mini-2025-01-31": ["reasoning"],
  "openai/o3-2025-04-16": ["reasoning"],
  "openai/o3-pro-2025-06-10": ["reasoning"],
  "openai/gpt-4.5-preview-2025-02-27": ["vision", "web", "docs"],
  "google/gemini-2.5-flash-lite-preview-06-17": ["vision", "web"],
  "google/gemini-2.5-flash": ["vision", "web", "docs"],
  "google/gemini-2.5-pro": ["vision", "web", "docs", "reasoning"],
  "anthropic/claude-3.5-sonnet": ["vision", "web", "docs", "reasoning"],
  "anthropic/claude-3-7-sonnet-20250219": [
    "vision",
    "web",
    "docs",
    "reasoning",
  ],
  "anthropic/claude-3-7-sonnet-20250219:thinking": [
    "vision",
    "web",
    "docs",
    "reasoning",
  ],
  "anthropic/claude-4-sonnet-20250522": ["vision", "web", "docs", "reasoning"],
  "anthropic/claude-4-opus-20250522": ["vision", "web", "docs", "reasoning"],
  "deepseek/deepseek-r1-0528:free": ["reasoning"],
  "x-ai/grok-3-mini-beta": ["web"],
  "x-ai/grok-3-beta": ["web", "reasoning"],
  "qwen/qwen3-14b-04-28:free": ["web"],
  "qwen/qwen3-235b-a22b-04-28": ["web", "docs"],
  "perplexity/sonar": ["web"],
  "perplexity/sonar-pro": ["web", "reasoning"],
  "perplexity/sonar-reasoning-pro": ["web", "reasoning"],
  "perplexity/sonar-deep-research": ["web", "docs", "reasoning"],
  "meta-llama/llama-3.3-70b-instruct": ["reasoning"],
};

// Model status mapping
const MODEL_STATUS: Record<string, "new" | "degraded" | "beta"> = {
  "claude-4-sonnet-20250522": "new",
  "claude-4-opus-20250522": "new",
  "o3-2025-04-16": "new",
  "grok-3-mini-beta": "beta",
  "grok-3-beta": "beta",
  "gemini-2.5-flash-lite-preview-06-17": "beta",
  // OpenRouter model status (with full paths)
  "anthropic/claude-4-sonnet-20250522": "new",
  "anthropic/claude-4-opus-20250522": "new",
  "openai/o3-2025-04-16": "new",
  "openai/o3-pro-2025-06-10": "new",
  "x-ai/grok-3-mini-beta": "beta",
  "x-ai/grok-3-beta": "beta",
  "google/gemini-2.5-flash-lite-preview-06-17": "beta",
  "openai/gpt-4.5-preview-2025-02-27": "beta",
};

interface ModelData {
  id: string;
  provider: string;
  providerName: string;
  displayName: string;
  capabilities: string[];
  status?: "new" | "degraded" | "beta";
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
    case "x-ai":
      return <Bot className="w-4 h-4 text-purple-500" />;
    case "perplexity":
      return <Search className="w-4 h-4 text-indigo-500" />;
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
  // Remove provider prefix and format properly
  const cleanModel = model.replace(
    /^(openai|google|anthropic|deepseek|x-ai|qwen|perplexity|meta-llama)\//,
    ""
  );

  // OpenAI models
  if (cleanModel === "gpt-4o") return "GPT-4o";
  if (cleanModel === "gpt-4.1-2025-04-14") return "GPT-4.1 (Apr 14, 2025)";
  if (cleanModel === "o4-mini-2025-04-16") return "o4-mini (Apr 16, 2025)";
  if (cleanModel === "o4-mini-high-2025-04-16")
    return "o4-mini High (Apr 16, 2025)";
  if (cleanModel === "o3-mini-2025-01-31") return "o3-mini (Jan 31, 2025)";
  if (cleanModel === "o3-2025-04-16") return "o3 (Apr 16, 2025)";
  if (cleanModel === "o3-pro-2025-06-10") return "o3 Pro (Jun 10, 2025)";
  if (cleanModel === "gpt-4.5-preview-2025-02-27")
    return "GPT-4.5 Preview (Feb 27, 2025)";

  // Google models
  if (cleanModel === "gemini-2.5-flash-lite-preview-06-17")
    return "Gemini 2.5 Flash Lite Preview";
  if (cleanModel === "gemini-2.5-flash") return "Gemini 2.5 Flash";
  if (cleanModel === "gemini-2.5-pro") return "Gemini 2.5 Pro";

  // Anthropic models
  if (cleanModel === "claude-3.5-sonnet") return "Claude 3.5 Sonnet";
  if (cleanModel === "claude-3-7-sonnet-20250219")
    return "Claude 3.7 Sonnet (Feb 19, 2025)";
  if (cleanModel === "claude-3-7-sonnet-20250219:thinking")
    return "Claude 3.7 Sonnet Thinking (Feb 19, 2025)";
  if (cleanModel === "claude-4-sonnet-20250522")
    return "Claude 4 Sonnet (May 22, 2025)";
  if (cleanModel === "claude-4-opus-20250522")
    return "Claude 4 Opus (May 22, 2025)";

  // DeepSeek models
  if (cleanModel === "deepseek-r1-0528:free") return "DeepSeek R1 (Free)";

  // X.AI models
  if (cleanModel === "grok-3-mini-beta") return "Grok 3 Mini (Beta)";
  if (cleanModel === "grok-3-beta") return "Grok 3 (Beta)";

  // Qwen models
  if (cleanModel === "qwen3-14b-04-28:free") return "Qwen3 14B (Free)";
  if (cleanModel === "qwen3-235b-a22b-04-28") return "Qwen3 235B";

  // Perplexity models
  if (cleanModel === "sonar") return "Sonar";
  if (cleanModel === "sonar-pro") return "Sonar Pro";
  if (cleanModel === "sonar-reasoning-pro") return "Sonar Reasoning Pro";
  if (cleanModel === "sonar-deep-research") return "Sonar Deep Research";

  // Meta models
  if (cleanModel === "llama-3.3-70b-instruct") return "Llama 3.3 70B Instruct";

  // Fallback formatting
  return cleanModel
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const getModelDisplayNameShort = (model: string) => {
  const cleanModel = model.replace(
    /^(openai|google|anthropic|deepseek|x-ai|qwen|perplexity|meta-llama)\//,
    ""
  );

  if (cleanModel === "gpt-4o") return "4o";
  if (cleanModel === "claude-3.5-sonnet") return "3.5 Sonnet";
  if (cleanModel === "claude-4-sonnet-20250522") return "4 Sonnet";
  if (cleanModel === "o3-mini-2025-01-31") return "o3 Mini";
  if (cleanModel === "o3-2025-04-16") return "o3";
  if (cleanModel === "sonar-pro") return "Sonar Pro";

  return cleanModel.split("-").slice(-1)[0] || cleanModel;
};

export function AIProviderSelector({
  selectedProvider,
  selectedModel,
  onProviderChange,
  reasoningLevel = "mid",
  onReasoningChange,
}: AIProviderSelectorProps) {
  const [open, setOpen] = useState(false);
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
    // Don't filter here - let Command component handle search
    const favoriteModels = allModels.filter((model) => model.isFavorited);
    const otherModels = allModels.filter((model) => !model.isFavorited);

    return {
      favorites: favoriteModels,
      others: otherModels,
    };
  }, [allModels, favorites]);

  const toggleFavorite = (modelId: string) => {
    setFavorites((prev) =>
      prev.includes(modelId)
        ? prev.filter((id) => id !== modelId)
        : [...prev, modelId]
    );
  };

  const handleModelSelect = (provider: string, model: string) => {
    console.log("🔧 handleModelSelect called with:", { provider, model });
    console.log("🔧 Current selected:", { selectedProvider, selectedModel });

    try {
      onProviderChange(provider, model);
      console.log("✅ onProviderChange called successfully");
      setOpen(false);
      console.log("✅ Modal closed");
    } catch (error) {
      console.error("❌ Error in handleModelSelect:", error);
    }
  };

  const supportsReasoning = (model: string) => {
    const capabilities = MODEL_CAPABILITIES[model] || [];
    return capabilities.includes("reasoning");
  };

  const selectedModelData = allModels.find((m) => m.id === selectedModel);

  return (
    <div className="flex items-center gap-2">
      {/* AI Provider Selector */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            aria-expanded={open}
            className="h-8 px-3 text-xs gap-2 border border-border/30 justify-between min-w-[200px] bg-background/60 backdrop-blur-md hover:bg-background/80 hover:border-border/50 transition-all duration-200"
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
            {open ? (
              <ChevronUp className="h-3 w-3 opacity-50" />
            ) : (
              <ChevronDown className="h-3 w-3 opacity-50" />
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className="w-96 p-0 bg-background/95 backdrop-blur-xl border border-border/50 shadow-2xl z-[100]"
          align="start"
          side="bottom"
          sideOffset={4}
        >
          <Command className="bg-transparent">
            <CommandInput
              placeholder="Search models..."
              className="bg-transparent border-none"
            />
            <CommandList className="max-h-[400px] bg-transparent">
              <CommandEmpty>No models found.</CommandEmpty>

              {/* Favorites */}
              {organizedModels.favorites.length > 0 && (
                <CommandGroup heading="⭐ Favorites">
                  {organizedModels.favorites.map((model) => (
                    <CommandItem
                      key={`${model.provider}-${model.id}`}
                      value={`${model.displayName} ${model.providerName} ${model.id}`}
                      onSelect={() => {
                        console.log(
                          "Favorite model selected:",
                          model.id,
                          model.provider
                        );
                        handleModelSelect(model.provider, model.id);
                      }}
                      className="flex items-center gap-3 px-3 py-2 cursor-pointer rounded-sm"
                    >
                      <div className="flex-shrink-0">
                        {getProviderIcon(model.provider)}
                      </div>
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
                              "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400",
                            model.status === "new" &&
                              "bg-green-500/20 text-green-600 dark:text-green-400",
                            model.status === "beta" &&
                              "bg-blue-500/20 text-blue-600 dark:text-blue-400"
                          )}
                        >
                          {model.status === "degraded"
                            ? "DEGRADED"
                            : model.status === "new"
                              ? "NEW"
                              : "BETA"}
                        </div>
                      )}

                      {/* Capabilities */}
                      <div className="flex items-center gap-1">
                        {model.capabilities.map((capability) => (
                          <div
                            key={capability}
                            className="flex items-center justify-center w-4 h-4 rounded bg-muted text-muted-foreground"
                            title={capability}
                          >
                            {getCapabilityIcon(capability)}
                          </div>
                        ))}
                      </div>

                      {/* Favorite Toggle */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(model.id);
                        }}
                        className="p-1 hover:bg-muted rounded transition-colors"
                        title={
                          model.isFavorited
                            ? "Remove from favorites"
                            : "Add to favorites"
                        }
                      >
                        <Heart
                          className={cn(
                            "h-3 w-3 transition-colors",
                            model.isFavorited
                              ? "fill-red-500 text-red-500"
                              : "text-muted-foreground hover:text-red-500"
                          )}
                        />
                      </button>

                      <Check
                        className={cn(
                          "ml-2 h-4 w-4",
                          selectedModel === model.id
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {/* All Models */}
              {organizedModels.others.length > 0 && (
                <CommandGroup heading="🤖 All Models">
                  {organizedModels.others.map((model) => (
                    <CommandItem
                      key={`${model.provider}-${model.id}`}
                      value={`${model.displayName} ${model.providerName} ${model.id}`}
                      onSelect={() => {
                        console.log(
                          "Model selected:",
                          model.id,
                          model.provider
                        );
                        handleModelSelect(model.provider, model.id);
                      }}
                      className="flex items-center gap-3 px-3 py-2 cursor-pointer rounded-sm"
                    >
                      <div className="flex-shrink-0">
                        {getProviderIcon(model.provider)}
                      </div>
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
                              "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400",
                            model.status === "new" &&
                              "bg-green-500/20 text-green-600 dark:text-green-400",
                            model.status === "beta" &&
                              "bg-blue-500/20 text-blue-600 dark:text-blue-400"
                          )}
                        >
                          {model.status === "degraded"
                            ? "DEGRADED"
                            : model.status === "new"
                              ? "NEW"
                              : "BETA"}
                        </div>
                      )}

                      {/* Capabilities */}
                      <div className="flex items-center gap-1">
                        {model.capabilities.map((capability) => (
                          <div
                            key={capability}
                            className="flex items-center justify-center w-4 h-4 rounded bg-muted text-muted-foreground"
                            title={capability}
                          >
                            {getCapabilityIcon(capability)}
                          </div>
                        ))}
                      </div>

                      {/* Favorite Toggle */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(model.id);
                        }}
                        className="p-1 hover:bg-muted rounded transition-colors"
                        title={
                          model.isFavorited
                            ? "Remove from favorites"
                            : "Add to favorites"
                        }
                      >
                        <Heart
                          className={cn(
                            "h-3 w-3 transition-colors",
                            model.isFavorited
                              ? "fill-red-500 text-red-500"
                              : "text-muted-foreground hover:text-red-500"
                          )}
                        />
                      </button>

                      <Check
                        className={cn(
                          "ml-2 h-4 w-4",
                          selectedModel === model.id
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Reasoning Level Control */}
      {supportsReasoning(selectedModel) && onReasoningChange && (
        <ThinkingModeSelector
          reasoningLevel={reasoningLevel}
          onReasoningChange={onReasoningChange}
        />
      )}
    </div>
  );
}
