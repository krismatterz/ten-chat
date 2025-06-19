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
import { Input } from "./ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { ThinkingModeSelector } from "./ui/thinking-mode-selector";

interface AIProviderSelectorProps {
	selectedProvider: string;
	selectedModel: string;
	onProviderChange: (provider: string, model: string) => void;
	reasoningLevel?: "low" | "mid" | "high";
	onReasoningChange?: (level: "low" | "mid" | "high") => void;
}

// Mock user favorites
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

// Model capabilities
const MODEL_CAPABILITIES: Record<string, string[]> = {
	"gpt-4o": ["vision", "web"],
	"gpt-4.1-2025-04-14": ["vision", "web", "docs"],
	"o3-mini-2025-01-31": ["reasoning"],
	"o3-2025-04-16": ["reasoning"],
	"claude-3.5-sonnet": ["vision", "web", "docs", "reasoning"],
	"claude-3-7-sonnet-20250219": ["vision", "web", "docs", "reasoning"],
	"claude-4-sonnet-20250522": ["vision", "web", "docs", "reasoning"],
	"sonar-pro": ["web", "reasoning"],
};

// Model status
const MODEL_STATUS: Record<string, "new" | "degraded" | "beta"> = {
	"claude-4-sonnet-20250522": "new",
	"o3-2025-04-16": "new",
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

const getModelDisplayName = (model: string) => {
	// Remove provider prefix and format properly
	const cleanModel = model.replace(
		/^(openai|google|anthropic|deepseek|x-ai|qwen|perplexity|meta-llama)\//,
		""
	);

	if (cleanModel === "gpt-4o") return "GPT-4o";
	if (cleanModel === "claude-3.5-sonnet") return "Claude 3.5 Sonnet";
	if (cleanModel === "claude-4-sonnet-20250522") return "Claude 4 Sonnet";
	if (cleanModel === "o3-mini-2025-01-31") return "o3 Mini";
	if (cleanModel === "o3-2025-04-16") return "o3";
	if (cleanModel === "sonar-pro") return "Sonar Pro";

	return cleanModel
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
	const [open, setOpen] = useState(false);
	const [search, setSearch] = useState("");
	const [favorites, setFavorites] = useState<string[]>(USER_FAVORITES);

	const currentProvider = AI_PROVIDERS.find((p) => p.id === selectedProvider);
	const displayName = currentProvider?.name || "Select AI";

	// Get all models with metadata
	const allModels = useMemo((): ModelData[] => {
		return AI_PROVIDERS.flatMap((provider) =>
			provider.models.map(
				(model, index): ModelData => ({
					id: model || `unknown-${provider.id}-${index}`, // Ensure unique ID
					provider: provider.id,
					providerName: provider.name,
					displayName: getModelDisplayName(model || `Unknown Model ${index}`),
					capabilities: MODEL_CAPABILITIES[model] || [],
					status: MODEL_STATUS[model],
					isFavorited: favorites.includes(model),
				})
			)
		);
	}, [favorites]);

	// Filter and organize models
	const filteredModels = useMemo(() => {
		const filtered = allModels.filter(
			(model) =>
				model.displayName.toLowerCase().includes(search.toLowerCase()) ||
				model.providerName.toLowerCase().includes(search.toLowerCase())
		);

		const favoriteModels = filtered.filter((model) => model.isFavorited);
		const otherModels = filtered.filter((model) => !model.isFavorited);

		return { favorites: favoriteModels, others: otherModels };
	}, [allModels, search]);

	const handleModelSelect = (provider: string, model: string) => {
		onProviderChange(provider, model);
		setOpen(false);
		setSearch("");
	};

	const handleKeyDown = (
		event: React.KeyboardEvent,
		provider: string,
		model: string
	) => {
		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			handleModelSelect(provider, model);
		}
	};

	const toggleFavorite = (modelId: string) => {
		setFavorites((prev) =>
			prev.includes(modelId)
				? prev.filter((id) => id !== modelId)
				: [...prev, modelId]
		);
	};

	const handleFavoriteKeyDown = (
		event: React.KeyboardEvent,
		modelId: string
	) => {
		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			event.stopPropagation();
			toggleFavorite(modelId);
		}
	};

	const supportsReasoning = (model: string) => {
		const capabilities = MODEL_CAPABILITIES[model] || [];
		return capabilities.includes("reasoning");
	};

	return (
		<div className="flex items-center gap-2">
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button
						variant="outline"
						className="h-8 px-3 text-xs gap-2 border border-border/30 justify-between min-w-[200px] bg-background/60 backdrop-blur-md hover:bg-background/80"
					>
						<div className="flex items-center gap-1.5">
							{getProviderIcon(selectedProvider)}
							<span className="font-medium">{displayName}</span>
						</div>
						<span className="text-muted-foreground">•</span>
						<span className="text-muted-foreground text-xs">
							{getModelDisplayName(selectedModel)}
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

				<PopoverContent className="w-96 p-0" align="start">
					{/* Search */}
					<div className="p-3 border-b">
						<Input
							placeholder="Search models..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="h-8"
						/>
					</div>

					{/* Models List */}
					<div className="max-h-[400px] overflow-y-auto">
						{/* Favorites */}
						{filteredModels.favorites.length > 0 && (
							<div>
								<div className="px-3 py-2 text-xs font-semibold text-muted-foreground border-b">
									⭐ Favorites
								</div>
								{filteredModels.favorites.map((model, modelIndex) => (
									<div
										key={`favorite-${model.id}-${modelIndex}`}
										onClick={() => handleModelSelect(model.provider, model.id)}
										onKeyDown={(e) =>
											handleKeyDown(e, model.provider, model.id)
										}
										className="w-full flex items-center gap-3 px-3 py-2 hover:bg-accent text-left cursor-pointer"
									>
										{getProviderIcon(model.provider)}
										<span className="flex-1 font-medium text-sm">
											{model.displayName}
										</span>

										{/* Status Badge */}
										{model.status && (
											<span
												className={cn(
													"px-1.5 py-0.5 text-xs font-medium rounded",
													model.status === "new" &&
														"bg-green-500/20 text-green-600"
												)}
											>
												NEW
											</span>
										)}

										{/* Capabilities */}
										<div className="flex items-center gap-1">
											{model.capabilities.map((capability, capIndex) => (
												<div
													key={`fav-${model.id}-${capability}-${capIndex}`}
													className="w-4 h-4 rounded bg-muted flex items-center justify-center"
													title={capability}
												>
													{getCapabilityIcon(capability)}
												</div>
											))}
										</div>

										<button
											type="button"
											onMouseDown={(e) => {
												e.stopPropagation();
												e.preventDefault();
												toggleFavorite(model.id);
											}}
											onKeyDown={(e) => handleFavoriteKeyDown(e, model.id)}
											className="p-1 hover:bg-muted rounded cursor-pointer"
											aria-label={`${model.isFavorited ? "Remove from" : "Add to"} favorites`}
										>
											<Heart
												className={cn(
													"h-3 w-3",
													model.isFavorited
														? "fill-red-500 text-red-500"
														: "text-muted-foreground"
												)}
											/>
										</button>

										<Check
											className={cn(
												"h-4 w-4",
												selectedModel === model.id ? "opacity-100" : "opacity-0"
											)}
										/>
									</div>
								))}
							</div>
						)}

						{/* All Models */}
						{filteredModels.others.length > 0 && (
							<div>
								<div className="px-3 py-2 text-xs font-semibold text-muted-foreground border-b">
									🤖 All Models
								</div>
								{filteredModels.others.map((model, modelIndex) => (
									<div
										key={`other-${model.id}-${modelIndex}`}
										onClick={() => handleModelSelect(model.provider, model.id)}
										onKeyDown={(e) =>
											handleKeyDown(e, model.provider, model.id)
										}
										className="w-full flex items-center gap-3 px-3 py-2 hover:bg-accent text-left cursor-pointer"
									>
										{getProviderIcon(model.provider)}
										<span className="flex-1 font-medium text-sm">
											{model.displayName}
										</span>

										{/* Status Badge */}
										{model.status && (
											<span
												className={cn(
													"px-1.5 py-0.5 text-xs font-medium rounded",
													model.status === "new" &&
														"bg-green-500/20 text-green-600"
												)}
											>
												NEW
											</span>
										)}

										{/* Capabilities */}
										<div className="flex items-center gap-1">
											{model.capabilities.map((capability, capIndex) => (
												<div
													key={`other-${model.id}-${capability}-${capIndex}`}
													className="w-4 h-4 rounded bg-muted flex items-center justify-center"
													title={capability}
												>
													{getCapabilityIcon(capability)}
												</div>
											))}
										</div>

										<button
											type="button"
											onMouseDown={(e) => {
												e.stopPropagation();
												e.preventDefault();
												toggleFavorite(model.id);
											}}
											onKeyDown={(e) => handleFavoriteKeyDown(e, model.id)}
											className="p-1 hover:bg-muted rounded cursor-pointer"
											aria-label={`${model.isFavorited ? "Remove from" : "Add to"} favorites`}
										>
											<Heart
												className={cn(
													"h-3 w-3",
													model.isFavorited
														? "fill-red-500 text-red-500"
														: "text-muted-foreground"
												)}
											/>
										</button>

										<Check
											className={cn(
												"h-4 w-4",
												selectedModel === model.id ? "opacity-100" : "opacity-0"
											)}
										/>
									</div>
								))}
							</div>
						)}

						{/* No Results */}
						{filteredModels.favorites.length === 0 &&
							filteredModels.others.length === 0 && (
								<div className="p-4 text-center text-muted-foreground text-sm">
									No models found
								</div>
							)}
					</div>
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
