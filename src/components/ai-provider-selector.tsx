"use client";

import { useState } from "react";
import { ChevronDown, Zap } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "~/lib/utils";

interface AIProvider {
  id: string;
  name: string;
  models: string[];
}

const AI_PROVIDERS: AIProvider[] = [
  {
    id: "anthropic",
    name: "Anthropic",
    models: ["claude-3-5-sonnet-20241022", "claude-3-haiku-20240307"],
  },
  {
    id: "openai",
    name: "OpenAI",
    models: ["gpt-4o", "gpt-4o-mini", "gpt-3.5-turbo"],
  },
  {
    id: "groq",
    name: "Groq",
    models: ["llama-3.1-70b-versatile", "llama-3.1-8b-instant"],
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    models: ["meta-llama/llama-3.2-3b-instruct"],
  },
  {
    id: "perplexity",
    name: "Perplexity",
    models: ["llama-3.1-sonar-small-128k-online"],
  },
];

interface AIProviderSelectorProps {
  selectedProvider: string;
  selectedModel: string;
  onProviderChange: (provider: string, model: string) => void;
}

export function AIProviderSelector({
  selectedProvider,
  selectedModel,
  onProviderChange,
}: AIProviderSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const currentProvider = AI_PROVIDERS.find((p) => p.id === selectedProvider);
  const displayName = currentProvider?.name || "Select AI";

  return (
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
          {selectedModel.split("-").slice(-1)[0] || selectedModel}
        </span>
        <ChevronDown
          className={cn("h-3 w-3 transition-transform", isOpen && "rotate-180")}
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
          <div className="absolute top-full mt-1 left-0 z-20 min-w-[280px] rounded-lg border bg-background/95 backdrop-blur-sm shadow-lg">
            <div className="p-2 space-y-1">
              {AI_PROVIDERS.map((provider) => (
                <div key={provider.id} className="space-y-1">
                  <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                    {provider.name}
                  </div>
                  {provider.models.map((model) => (
                    <button
                      key={model}
                      onClick={() => {
                        onProviderChange(provider.id, model);
                        setIsOpen(false);
                      }}
                      className={cn(
                        "w-full px-3 py-2 text-left text-sm rounded-md transition-colors hover:bg-accent",
                        selectedProvider === provider.id &&
                          selectedModel === model
                          ? "bg-secondary"
                          : ""
                      )}
                    >
                      <div className="font-medium">{model}</div>
                      <div className="text-xs text-muted-foreground">
                        {provider.name} model
                      </div>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
