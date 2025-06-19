"use client";

import { Brain, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { cn } from "~/lib/utils";

interface ReasoningViewProps {
	reasoning?: string;
	reasoningDetails?: Array<{
		type: "text" | "redacted";
		text?: string;
		data?: string;
	}>;
	className?: string;
}

export function ReasoningView({
	reasoning,
	reasoningDetails,
	className,
}: ReasoningViewProps) {
	const [isExpanded, setIsExpanded] = useState(false);

	// Don't render if no reasoning content
	if (!reasoning && !reasoningDetails?.length) {
		return null;
	}

	const hasContent = Boolean(
		reasoning?.trim() || reasoningDetails?.some((d) => d.text || d.data)
	);

	if (!hasContent) {
		return null;
	}

	return (
		<div
			className={cn(
				"mt-3 border border-border/30 rounded-lg overflow-hidden",
				className
			)}
		>
			{/* Header - Always visible */}
			<button
				type="button"
				onClick={() => setIsExpanded(!isExpanded)}
				className="w-full px-3 py-2 flex items-center justify-between bg-muted/30 hover:bg-muted/50 transition-colors text-left"
			>
				<div className="flex items-center gap-2">
					<Brain className="h-4 w-4 text-purple-600 dark:text-purple-400" />
					<span className="text-sm font-medium text-foreground">
						AI Reasoning
					</span>
					<span className="text-xs text-muted-foreground">
						({reasoning?.split(" ").length || reasoningDetails?.length || 0}{" "}
						tokens)
					</span>
				</div>
				{isExpanded ? (
					<ChevronDown className="h-4 w-4 text-muted-foreground" />
				) : (
					<ChevronRight className="h-4 w-4 text-muted-foreground" />
				)}
			</button>

			{/* Content - Expandable */}
			{isExpanded && (
				<div className="px-3 py-3 bg-background/50 border-t border-border/20">
					{reasoning && (
						<div className="text-sm text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed">
							{reasoning}
						</div>
					)}

					{reasoningDetails && reasoningDetails.length > 0 && (
						<div className="space-y-2">
							{reasoningDetails.map((detail, index) => (
								<div key={detail.text} className="text-sm">
									{detail.type === "text" && detail.text && (
										<div className="text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed">
											{detail.text}
										</div>
									)}
									{detail.type === "redacted" && (
										<div className="text-xs text-muted-foreground/60 italic p-2 bg-muted/20 rounded border-l-2 border-orange-500/30">
											<span className="text-orange-600 dark:text-orange-400">
												[Redacted reasoning content]
											</span>
										</div>
									)}
								</div>
							))}
						</div>
					)}

					{/* Copy button for reasoning */}
					<div className="mt-3 pt-2 border-t border-border/10">
						<button
							type="button"
							onClick={async () => {
								const content =
									reasoning ||
									reasoningDetails
										?.map((d) => d.text || "[Redacted]")
										.join("\n") ||
									"";
								try {
									await navigator.clipboard.writeText(content);
									// Could add toast notification here
								} catch (error) {
									console.error("Failed to copy reasoning:", error);
								}
							}}
							className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
						>
							<svg
								aria-hidden="true"
								className="h-3 w-3"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								aria-label="Copy reasoning"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
								/>
							</svg>
							Copy reasoning
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
