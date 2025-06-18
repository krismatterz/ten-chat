import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function formatTimestamp(timestamp: number | string | Date): string {
	const date = new Date(timestamp);
	const now = new Date();
	const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

	if (diffInSeconds < 60) {
		return "Just now";
	}
	if (diffInSeconds < 3600) {
		const minutes = Math.floor(diffInSeconds / 60);
		return `${minutes}m ago`;
	}
	if (diffInSeconds < 86400) {
		const hours = Math.floor(diffInSeconds / 3600);
		return `${hours}h ago`;
	}
	if (diffInSeconds < 604800) {
		const days = Math.floor(diffInSeconds / 86400);
		return `${days}d ago`;
	}

	return date.toLocaleDateString();
}

export function generateChatTitle(defaultTitle?: string): string {
	const adjectives = [
		"Quick",
		"Smart",
		"Creative",
		"Helpful",
		"Bright",
		"Clear",
		"Swift",
		"Deep",
		"Fresh",
		"Sharp",
		"Wise",
		"Bold",
		"Calm",
		"Pure",
		"Rich",
		"Vast",
	];

	const nouns = [
		"Chat",
		"Talk",
		"Discussion",
		"Conversation",
		"Session",
		"Exchange",
		"Dialogue",
		"Meeting",
		"Conference",
		"Inquiry",
		"Query",
		"Question",
	];

	if (defaultTitle && defaultTitle !== "New Chat") {
		return defaultTitle;
	}

	const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
	const noun = nouns[Math.floor(Math.random() * nouns.length)];

	return `${adjective} ${noun}`;
}
