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

export async function POST(req: Request) {
  try {
    const { messages, provider = "anthropic", model } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response("Invalid messages format", { status: 400 });
    }

    // Select provider and model
    let aiProvider;
    let selectedModel: string;

    switch (provider) {
      case "anthropic":
        aiProvider = anthropic;
        selectedModel = model || "claude-3-5-sonnet-20241022";
        break;
      case "openai":
        aiProvider = openai;
        selectedModel = model || "gpt-4o-mini";
        break;
      case "groq":
        aiProvider = groq;
        selectedModel = model || "llama-3.1-8b-instant";
        break;
      default:
        return new Response("Invalid provider", { status: 400 });
    }

    // Ensure we have the API key for the selected provider
    if (provider === "anthropic" && !env.ANTHROPIC_API_KEY) {
      return new Response("Anthropic API key not configured", { status: 500 });
    }
    if (provider === "openai" && !env.OPENAI_API_KEY) {
      return new Response("OpenAI API key not configured", { status: 500 });
    }
    if (provider === "groq" && !env.GROQ_API_KEY) {
      return new Response("Groq API key not configured", { status: 500 });
    }

    // Create the streaming response
    const result = await streamText({
      model: aiProvider(selectedModel),
      messages: messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      })),
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
