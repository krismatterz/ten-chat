import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import { env } from "~/env";
import { formatFilesForAI, processMultipleFiles } from "~/lib/file-processor";

// Initialize providers
const groq = createOpenAI({
	baseURL: "https://api.groq.com/openai/v1",
	apiKey: env.GROQ_API_KEY,
});

const openrouter = createOpenAI({
	baseURL: "https://openrouter.ai/api/v1",
	apiKey: env.OPENROUTER_API_KEY,
	headers: {
		"HTTP-Referer": "https://ten-chat.vercel.app",
		"X-Title": "Ten Chat",
	},
});

const perplexity = createOpenAI({
	baseURL: "https://api.perplexity.ai",
	apiKey: env.PERPLEXITY_API_KEY,
});

const ollama = createOpenAI({
	baseURL: env.OLLAMA_BASE_URL || "http://localhost:11434/v1",
	apiKey: "ollama", // Ollama doesn't require a real API key
});

const lmstudio = createOpenAI({
	baseURL: env.LM_STUDIO_BASE_URL || "http://localhost:1234/v1",
	apiKey: "lm-studio", // LM Studio doesn't require a real API key
});

// Helper function to process message content with attachments
async function processMessageContent(message: any) {
	// If no attachments, return simple text content
	if (!message.attachments || message.attachments.length === 0) {
		return message.content || "";
	}

	// Build multimodal content array
	const contentParts: any[] = [];

	// Add text content if it exists
	if (message.content?.trim()) {
		contentParts.push({
			type: "text",
			text: message.content,
		});
	}

	// Process files using the new file processor
	try {
		const processedFiles = await processMultipleFiles(message.attachments);

		for (const file of processedFiles) {
			if (file.type.startsWith("image/")) {
				// Handle images - send both image URL and description for vision models
				const attachment = message.attachments.find(
					(a: any) => a.name === file.name
				);
				if (attachment) {
					contentParts.push({
						type: "image",
						image: attachment.url,
					});
				}
			} else {
				// Handle all other file types (now including PDFs, Word docs, etc.)
				if (file.error) {
					contentParts.push({
						type: "text",
						text: `File: ${file.name}\nError processing file: ${file.error}`,
					});
				} else {
					contentParts.push({
						type: "text",
						text: `File: ${file.name} (${file.type})\n\n${file.content}`,
					});
				}
			}
		}
	} catch (error) {
		console.error("Error processing attachments:", error);
		contentParts.push({
			type: "text",
			text: `Error processing attached files: ${error instanceof Error ? error.message : "Unknown error"}`,
		});
	}

	// If no content parts were added, return default message
	if (contentParts.length === 0) {
		contentParts.push({
			type: "text",
			text: "Files shared",
		});
	}

	return contentParts;
}

export async function POST(req: Request) {
	try {
		const {
			messages,
			provider = "anthropic",
			model,
			attachments,
		} = await req.json();

		console.log("🚀 API Route - Provider:", provider, "Model:", model);
		console.log("📝 Messages count:", messages?.length);
		console.log("📎 Attachments:", attachments?.length || 0);

		if (!messages || !Array.isArray(messages)) {
			return new Response("Invalid messages format", { status: 400 });
		}

		// Select provider and model
		let selectedModel: string;
		let aiModel: any;

		switch (provider) {
			case "anthropic":
				if (!env.ANTHROPIC_API_KEY) {
					return new Response("Anthropic API key not configured", {
						status: 500,
					});
				}
				selectedModel = model || "claude-3-5-sonnet-20241022";
				aiModel = anthropic(selectedModel);
				break;
			case "openai":
				if (!env.OPENAI_API_KEY) {
					return new Response("OpenAI API key not configured", { status: 500 });
				}
				selectedModel = model || "gpt-4o-mini";
				aiModel = openai(selectedModel);
				break;
			case "groq":
				if (!env.GROQ_API_KEY) {
					return new Response("Groq API key not configured", { status: 500 });
				}
				selectedModel = model || "llama-3.1-8b-instant";
				aiModel = groq(selectedModel);
				break;
			case "openrouter":
				if (!env.OPENROUTER_API_KEY) {
					console.error("❌ OpenRouter API key not configured");
					return new Response("OpenRouter API key not configured", {
						status: 500,
					});
				}
				selectedModel = model || "anthropic/claude-3.5-sonnet";
				console.log("🔧 OpenRouter selected model:", selectedModel);
				aiModel = openrouter(selectedModel);
				break;
			case "perplexity":
				if (!env.PERPLEXITY_API_KEY) {
					return new Response("Perplexity API key not configured", {
						status: 500,
					});
				}
				selectedModel = model || "llama-3.1-sonar-small-128k-online";
				aiModel = perplexity(selectedModel);
				break;
			case "ollama":
				selectedModel = model || "llama3.2:3b";
				aiModel = ollama(selectedModel);
				break;
			case "lmstudio":
				selectedModel = model || "llama-3.2-3b-instruct";
				aiModel = lmstudio(selectedModel);
				break;
			default:
				return new Response("Invalid provider", { status: 400 });
		}

		// Process messages with attachments for multimodal content
		const processedMessages = await Promise.all(
			messages.map(async (msg: any) => {
				// If this is the latest user message and we have current attachments, use them
				const isLatestUserMessage =
					msg.role === "user" && messages.indexOf(msg) === messages.length - 1;
				const messageWithAttachments =
					isLatestUserMessage && attachments ? { ...msg, attachments } : msg;

				return {
					role: msg.role,
					content: await processMessageContent(messageWithAttachments),
				};
			})
		);

		// Create the streaming response using AI SDK v4
		const result = streamText({
			model: aiModel,
			messages: processedMessages,
			system:
				"You are a helpful AI assistant. Be concise, friendly, and informative in your responses. When images are shared, analyze them thoroughly and provide detailed descriptions or answer questions about them. When files are shared, read their content carefully and help the user with any questions about the content.",
			maxTokens: 2048,
			temperature: 0.7,
		});

		// Use AI SDK v4 method
		console.log("✅ Streaming response created successfully");
		return result.toDataStreamResponse();
	} catch (error) {
		console.error("💥 Chat API error:", error);
		console.error("💥 Error details:", {
			name: error instanceof Error ? error.name : "Unknown",
			message: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
		});
		return new Response("Internal server error", { status: 500 });
	}
}
