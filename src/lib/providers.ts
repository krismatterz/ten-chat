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
		models: ["claude-3-5-sonnet-20241022", "claude-4-sonnet", "claude-4-opus"],
		requiresApiKey: true,
		description:
			"Anthropic's Claude models - excellent for reasoning, analysis and coding",
	},
	{
		id: "openai",
		name: "OpenAI",
		models: [
			"gpt-4o",
			"gpt-4o-mini",
			"o4-mini",
			"o3-mini",
			"o3-mini-high",
			"o3",
		],
		requiresApiKey: true,
		description: "OpenAI's GPT and O models - versatile and widely used",
	},
	{
		id: "openrouter",
		name: "OpenRouter",
		models: [
			"openai/gpt-4o",
			"openai/gpt-4.1-2025-04-14",
			"openai/o4-mini-2025-04-16",
			"openai/o4-mini-high-2025-04-16",
			"openai/o3-mini-2025-01-31",
			"openai/o3-2025-04-16",
			"openai/o3-pro-2025-06-10",
			"openai/gpt-4.5-preview-2025-02-27",
			"google/gemini-2.5-flash-lite-preview-06-17",
			"google/gemini-2.5-flash",
			"google/gemini-2.5-pro",
			"anthropic/claude-3.5-sonnet",
			"anthropic/claude-3-7-sonnet-20250219",
			"anthropic/claude-3-7-sonnet-20250219:thinking",
			"anthropic/claude-4-sonnet-20250522",
			"anthropic/claude-4-opus-20250522",
			"deepseek/deepseek-r1-0528:free",
			"x-ai/grok-3-mini-beta",
			"x-ai/grok-3-beta",
			"qwen/qwen3-14b-04-28:free",
			"qwen/qwen3-235b-a22b-04-28",
			"perplexity/sonar",
			"perplexity/sonar-pro",
			"perplexity/sonar-reasoning-pro",
			"perplexity/sonar-deep-research",
			"meta-llama/llama-3.3-70b-instruct",
		],
		requiresApiKey: true,
		description: "Access to multiple AI models through a single API",
	},
	{
		id: "perplexity",
		name: "Perplexity",
		models: [
			"sonar",
			"sonar-pro",
			"sonar-reasoning-pro",
			"sonar-deep-research",
		],
		requiresApiKey: true,
		description: "Perplexity's search-augmented models with real-time data",
	},
	{
		id: "xai",
		name: "X/AI",
		models: ["grok-3-mini-beta", "grok-3-beta"],
		requiresApiKey: true,
		description: "X/AI's models - great for reasoning and analysis",
	},
	{
		id: "groq",
		name: "Groq",
		models: [
			"gemma2-9b-it",
			"llama-3.2-70b-preview",
			"llama-3.2-13b-preview",
			"llama-3.1-8b-instant",
		],
		requiresApiKey: true,
		description: "Groq's ultra-fast inference - great for quick responses",
	},
	{
		id: "ollama",
		name: "Ollama",
		models: ["llama3.2:3b", "llama3.2:1b"],
		requiresApiKey: false,
		baseUrl: "http://localhost:11434",
		description: "Local models running on Ollama - private and offline",
	},
	{
		id: "lmstudio",
		name: "LM Studio",
		models: [""],
		requiresApiKey: false,
		baseUrl: "http://localhost:1234",
		description: "Local models via LM Studio - easy model management",
	},
	{
		id: "azure",
		name: "Azure",
		models: [""],
		requiresApiKey: true,
	},
	{
		id: "mistral",
		name: "Mistral",
		models: [""],
		requiresApiKey: true,
	},
	{
		id: "deepseek",
		name: "DeepSeek",
		models: ["deepseek-r1-0528"],
		requiresApiKey: true,
	},
];

export type ProviderType =
	| "anthropic"
	| "openai"
	| "groq"
	| "openrouter"
	| "perplexity"
	| "ollama"
	| "lmstudio"
	| "xai"
	| "azure"
	| "mistral"
	| "deepseek";
export function getProviderById(id: ProviderType): AIProvider | undefined {
	return AI_PROVIDERS.find((provider) => provider.id === id);
}

export function getAvailableProviders(): AIProvider[] {
	return AI_PROVIDERS;
}
