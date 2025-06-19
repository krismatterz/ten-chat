import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  // Less than 1 minute ago
  if (diff < 60 * 1000) {
    return "just now";
  }

  // Less than 1 hour ago
  if (diff < 60 * 60 * 1000) {
    const minutes = Math.floor(diff / (60 * 1000));
    return `${minutes}m ago`;
  }

  // Less than 24 hours ago
  if (diff < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diff / (60 * 60 * 1000));
    return `${hours}h ago`;
  }

  // Less than 7 days ago
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    return `${days}d ago`;
  }

  // More than 7 days ago, show date
  return date.toLocaleDateString();
}

export function formatProviderName(provider: string): string {
  switch (provider) {
    case "openrouter":
      return "OpenRouter";
    case "anthropic":
      return "Anthropic";
    case "openai":
      return "OpenAI";
    case "google":
      return "Google";
    case "groq":
      return "Groq";
    case "x-ai":
      return "xAI";
    case "perplexity":
      return "Perplexity";
    case "meta":
      return "Meta";
    case "mistral":
      return "Mistral";
    default:
      return provider.charAt(0).toUpperCase() + provider.slice(1);
  }
}

export function formatModelName(provider: string, model: string): string {
  // Handle OpenRouter models specially
  if (provider === "openrouter") {
    // Handle DeepSeek models
    if (model.includes("deepseek")) {
      if (model.includes("deepseek-r1")) {
        return "DeepSeek R1";
      }
      if (model.includes("deepseek-reasoner")) {
        return "DeepSeek Reasoner";
      }
      if (model.includes("deepseek-chat")) {
        return "DeepSeek Chat";
      }
      if (model.includes("deepseek-v3")) {
        return "DeepSeek V3";
      }
      return "DeepSeek";
    }

    // Handle Claude models
    if (model.includes("claude")) {
      if (
        model.includes("claude-3-5-sonnet") ||
        model.includes("claude-3.5-sonnet")
      ) {
        return "Claude 3.5 Sonnet";
      }
      if (
        model.includes("claude-3-5-haiku") ||
        model.includes("claude-3.5-haiku")
      ) {
        return "Claude 3.5 Haiku";
      }
      if (model.includes("claude-3-opus")) {
        return "Claude 3 Opus";
      }
      if (model.includes("claude-3-haiku")) {
        return "Claude 3 Haiku";
      }
      if (model.includes("claude-4")) {
        return "Claude 4";
      }
      return "Claude";
    }

    // Handle GPT models
    if (model.includes("gpt")) {
      if (model.includes("gpt-4o-mini")) {
        return "GPT-4o Mini";
      }
      if (model.includes("gpt-4o")) {
        return "GPT-4o";
      }
      if (model.includes("gpt-4-turbo")) {
        return "GPT-4 Turbo";
      }
      if (model.includes("gpt-4")) {
        return "GPT-4";
      }
      if (model.includes("gpt-3.5-turbo")) {
        return "GPT-3.5 Turbo";
      }
      if (model.includes("gpt-3.5")) {
        return "GPT-3.5";
      }
      return "GPT";
    }

    // Handle o1 models
    if (model.includes("o1")) {
      if (model.includes("o1-mini")) {
        return "o1-mini";
      }
      if (model.includes("o1-preview")) {
        return "o1-preview";
      }
      return "o1";
    }

    // Handle Llama models
    if (model.includes("llama")) {
      if (model.includes("llama-3.3")) {
        return "Llama 3.3";
      }
      if (model.includes("llama-3.1")) {
        return "Llama 3.1";
      }
      if (model.includes("llama-3")) {
        return "Llama 3";
      }
      if (model.includes("llama-2")) {
        return "Llama 2";
      }
      return "Llama";
    }

    // Handle Gemini models
    if (model.includes("gemini")) {
      if (model.includes("gemini-2.0")) {
        return "Gemini 2.0";
      }
      if (model.includes("gemini-1.5-pro")) {
        return "Gemini 1.5 Pro";
      }
      if (model.includes("gemini-1.5")) {
        return "Gemini 1.5";
      }
      return "Gemini";
    }

    // Handle Mixtral models
    if (model.includes("mixtral")) {
      if (model.includes("mixtral-8x7b")) {
        return "Mixtral 8x7B";
      }
      if (model.includes("mixtral-8x22b")) {
        return "Mixtral 8x22B";
      }
      return "Mixtral";
    }

    // Handle Perplexity models
    if (model.includes("sonar")) {
      if (model.includes("sonar-pro")) {
        return "Sonar Pro";
      }
      if (model.includes("sonar-reasoning")) {
        return "Sonar Reasoning";
      }
      return "Sonar";
    }

    // Extract model name from path format (e.g., "anthropic/claude-3-5-sonnet" -> "Claude 3.5 Sonnet")
    const modelPart = model.split("/").pop() || model;
    return modelPart
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  // For direct providers, clean up the model name
  switch (provider) {
    case "anthropic":
      if (
        model.includes("claude-3-5-sonnet") ||
        model.includes("claude-3.5-sonnet")
      ) {
        return "Claude 3.5 Sonnet";
      }
      if (
        model.includes("claude-3-5-haiku") ||
        model.includes("claude-3.5-haiku")
      ) {
        return "Claude 3.5 Haiku";
      }
      if (model.includes("claude-3-opus")) {
        return "Claude 3 Opus";
      }
      if (model.includes("claude-3-haiku")) {
        return "Claude 3 Haiku";
      }
      if (model.includes("claude-4")) {
        return "Claude 4";
      }
      return model;

    case "openai":
      if (model.includes("gpt-4o-mini")) {
        return "GPT-4o Mini";
      }
      if (model.includes("gpt-4o")) {
        return "GPT-4o";
      }
      if (model.includes("gpt-4-turbo")) {
        return "GPT-4 Turbo";
      }
      if (model.includes("gpt-4")) {
        return "GPT-4";
      }
      if (model.includes("o1-mini")) {
        return "o1-mini";
      }
      if (model.includes("o1-preview")) {
        return "o1-preview";
      }
      if (model.includes("o1")) {
        return "o1";
      }
      return model;

    case "groq":
      if (model.includes("llama-3.3")) {
        return "Llama 3.3";
      }
      if (model.includes("llama-3.1")) {
        return "Llama 3.1";
      }
      if (model.includes("llama-3")) {
        return "Llama 3";
      }
      if (model.includes("llama")) {
        return "Llama";
      }
      if (model.includes("mixtral")) {
        return "Mixtral";
      }
      return model;

    case "google":
      if (model.includes("gemini-2.0")) {
        return "Gemini 2.0";
      }
      if (model.includes("gemini-1.5-pro")) {
        return "Gemini 1.5 Pro";
      }
      if (model.includes("gemini-1.5")) {
        return "Gemini 1.5";
      }
      return model;

    case "perplexity":
      if (model.includes("sonar-pro")) {
        return "Sonar Pro";
      }
      if (model.includes("sonar-reasoning")) {
        return "Sonar Reasoning";
      }
      return model;

    default:
      return model;
  }
}

export function generateChatTitle(content: string): string {
  if (!content || content.trim().length === 0) {
    return "New Chat";
  }

  // Clean and truncate the content
  const cleaned = content.trim().replace(/\s+/g, " ");

  if (cleaned.length <= 50) {
    return cleaned;
  }

  // Find a good breaking point
  const truncated = cleaned.substring(0, 47);
  const lastSpace = truncated.lastIndexOf(" ");

  if (lastSpace > 20) {
    return `${truncated.substring(0, lastSpace)}...`;
  }

  return `${truncated}...`;
}
