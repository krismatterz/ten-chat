export interface AIProvider {
  id: string;
  name: string;
  models: string[];
  requiresApiKey?: boolean;
  baseUrl?: string;
  description?: string;
}

export const AI_PROVIDERS: AIProvider[] = [
  {
    id: "anthropic",
    name: "Anthropic",
    models: [
      "claude-3-5-sonnet-20241022",
      "claude-3-5-haiku-20241022",
      "claude-3-opus-20240229",
      "claude-3-sonnet-20240229",
      "claude-3-haiku-20240307",
    ],
    requiresApiKey: true,
    description:
      "Anthropic's Claude models - excellent for reasoning and analysis",
  },
  {
    id: "openai",
    name: "OpenAI",
    models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-4", "gpt-3.5-turbo"],
    requiresApiKey: true,
    description: "OpenAI's GPT models - versatile and widely used",
  },
  {
    id: "groq",
    name: "Groq",
    models: [
      "llama-3.1-8b-instant",
      "llama-3.1-70b-versatile",
      "llama-3.2-1b-preview",
      "llama-3.2-3b-preview",
      "mixtral-8x7b-32768",
      "gemma2-9b-it",
    ],
    requiresApiKey: true,
    description: "Groq's ultra-fast inference - great for quick responses",
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    models: [
      "anthropic/claude-3.5-sonnet",
      "anthropic/claude-3-opus",
      "openai/gpt-4o",
      "openai/gpt-4-turbo",
      "meta-llama/llama-3.1-8b-instruct",
      "meta-llama/llama-3.1-70b-instruct",
      "meta-llama/llama-3.1-405b-instruct",
      "google/gemini-pro-1.5",
      "mistralai/mixtral-8x7b-instruct",
      "qwen/qwen-2.5-72b-instruct",
    ],
    requiresApiKey: true,
    description: "Access to multiple AI models through a single API",
  },
  {
    id: "perplexity",
    name: "Perplexity",
    models: [
      "llama-3.1-sonar-small-128k-online",
      "llama-3.1-sonar-large-128k-online",
      "llama-3.1-sonar-huge-128k-online",
      "llama-3.1-8b-instruct",
      "llama-3.1-70b-instruct",
    ],
    requiresApiKey: true,
    description: "Perplexity's search-augmented models with real-time data",
  },
  {
    id: "ollama",
    name: "Ollama",
    models: [
      "llama3.2:3b",
      "llama3.2:1b",
      "llama3.1:8b",
      "llama3.1:70b",
      "qwen2.5:7b",
      "mistral:7b",
      "codellama:7b",
      "deepseek-coder:6.7b",
      "phi3:3.8b",
      "gemma2:9b",
    ],
    requiresApiKey: false,
    baseUrl: "http://localhost:11434",
    description: "Local models running on Ollama - private and offline",
  },
  {
    id: "lmstudio",
    name: "LM Studio",
    models: [
      "llama-3.2-3b-instruct",
      "llama-3.1-8b-instruct",
      "qwen2.5-7b-instruct",
      "mistral-7b-instruct",
      "phi-3-mini-4k-instruct",
      "codellama-7b-instruct",
    ],
    requiresApiKey: false,
    baseUrl: "http://localhost:1234",
    description: "Local models via LM Studio - easy model management",
  },
];

export type ProviderType =
  | "anthropic"
  | "openai"
  | "groq"
  | "openrouter"
  | "perplexity"
  | "ollama"
  | "lmstudio";

export function getProviderById(id: ProviderType): AIProvider | undefined {
  return AI_PROVIDERS.find((provider) => provider.id === id);
}

export function getAvailableProviders(): AIProvider[] {
  return AI_PROVIDERS;
}
