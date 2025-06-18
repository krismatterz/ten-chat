import { streamText, type CoreMessage } from "ai";
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
    let aiProvider:
      | ReturnType<typeof anthropic>
      | ReturnType<typeof openai>
      | ReturnType<typeof createOpenAI>;
    let selectedModel: string;

    switch (provider) {
      case "anthropic":
        if (!env.ANTHROPIC_API_KEY) {
          return new Response("Anthropic API key not configured", {
            status: 500,
          });
        }
        aiProvider = anthropic;
        selectedModel = model || "claude-3-5-sonnet-20241022";
        break;
      case "openai":
        if (!env.OPENAI_API_KEY) {
          return new Response("OpenAI API key not configured", { status: 500 });
        }
        aiProvider = openai;
        selectedModel = model || "gpt-4o-mini";
        break;
      case "groq":
        if (!env.GROQ_API_KEY) {
          return new Response("Groq API key not configured", { status: 500 });
        }
        aiProvider = groq;
        selectedModel = model || "llama-3.1-8b-instant";
        break;
      case "openrouter":
        if (!env.OPENROUTER_API_KEY) {
          return new Response("OpenRouter API key not configured", {
            status: 500,
          });
        }
        aiProvider = openrouter;
        selectedModel = model || "anthropic/claude-3.5-sonnet";
        break;
      case "perplexity":
        if (!env.PERPLEXITY_API_KEY) {
          return new Response("Perplexity API key not configured", {
            status: 500,
          });
        }
        aiProvider = perplexity;
        selectedModel = model || "llama-3.1-sonar-small-128k-online";
        break;
      case "ollama":
        aiProvider = ollama;
        selectedModel = model || "llama3.2:3b";
        break;
      case "lmstudio":
        aiProvider = lmstudio;
        selectedModel = model || "llama-3.2-3b-instruct";
        break;
      default:
        return new Response("Invalid provider", { status: 400 });
    }

    // Create the streaming response
    const result = await streamText({
      model: aiProvider(selectedModel),
      messages: messages.map(
        (msg: { role: string; content: string }): CoreMessage => {
          if (
            msg.role === "user" ||
            msg.role === "assistant" ||
            msg.role === "system"
          ) {
            return {
              role: msg.role,
              content: msg.content,
            };
          }
          // Default to user role if unknown
          return {
            role: "user",
            content: msg.content,
          };
        }
      ),
      system:
        "You are a helpful AI assistant. Be concise, friendly, and informative in your responses.",
      maxTokens: 2048,
      temperature: 0.7,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
