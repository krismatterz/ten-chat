"use client";

import { cn } from "~/lib/utils";

interface BetaBadgeProps {
	className?: string;
}

export function BetaBadge({ className }: BetaBadgeProps) {
	return (
		<span
			className={cn(
				"inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
				"bg-[#C026D3] text-white",
				className
			)}
		>
			Beta
		</span>
	);
}
