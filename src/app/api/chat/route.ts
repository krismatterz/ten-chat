import { streamText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import { createOpenAI } from "@ai-sdk/openai";
import { env } from "~/env";

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

export async function POST(req: Request) {
  try {
    const { messages, provider = "anthropic", model } = await req.json();

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
          return new Response("OpenRouter API key not configured", {
            status: 500,
          });
        }
        selectedModel = model || "anthropic/claude-3.5-sonnet";
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

    // Create the streaming response using AI SDK v4
    const result = streamText({
      model: aiModel,
      messages: messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content || "",
      })),
      system:
        "You are a helpful AI assistant. Be concise, friendly, and informative in your responses.",
      maxTokens: 2048,
      temperature: 0.7,
    });

    // Use AI SDK v4 method
    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
