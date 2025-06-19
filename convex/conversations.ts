import { v } from "convex/values";
import { nanoid } from "nanoid";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./auth";

// Get all conversations for the current user
export const list = query({
  args: {
    projectId: v.optional(v.id("projects")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { projectId, limit = 50 }) => {
    const user = await requireUser(ctx);

    let conversations: any;

    if (projectId) {
      conversations = await ctx.db
        .query("conversations")
        .withIndex("by_project_updated", (q) => q.eq("projectId", projectId))
        .order("desc")
        .take(limit);
    } else {
      conversations = await ctx.db
        .query("conversations")
        .withIndex("by_user_updated", (q) => q.eq("userId", user._id))
        .order("desc")
        .take(limit);
    }

    // Filter by user ownership if not filtered by project
    return conversations.filter(
      (c: any) => c.userId === user._id && !c.isDeleted
    );
  },
});

// Get a specific conversation with its messages
export const get = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, { conversationId }) => {
    const user = await requireUser(ctx);

    const conversation = await ctx.db.get(conversationId);
    if (
      !conversation ||
      conversation.userId !== user._id ||
      conversation.isDeleted
    ) {
      throw new Error("Conversation not found");
    }

    return conversation;
  },
});

// Create a new conversation with AI-generated title
export const create = mutation({
  args: {
    title: v.string(),
    model: v.string(),
    provider: v.string(),
    projectId: v.optional(v.id("projects")),
    initialMessage: v.optional(v.string()),
  },
  handler: async (
    ctx,
    { title, model, provider, projectId, initialMessage }
  ) => {
    const user = await requireUser(ctx);

    // Get default project if none specified
    let finalProjectId = projectId;
    if (!finalProjectId) {
      const defaultProject = await ctx.db
        .query("projects")
        .withIndex("by_default", (q) =>
          q.eq("userId", user._id).eq("isDefault", true)
        )
        .first();

      if (!defaultProject) {
        // Create default project inline
        const now = Date.now();
        finalProjectId = await ctx.db.insert("projects", {
          name: "Personal",
          description: "Default workspace",
          icon: "💬",
          color: "#3b82f6",
          userId: user._id,
          isDefault: true,
          createdAt: now,
          updatedAt: now,
        });
      } else {
        finalProjectId = defaultProject._id;
      }
    }

    const now = Date.now();
    const messages = [];

    // Add initial message if provided
    if (initialMessage) {
      messages.push({
        id: nanoid(),
        role: "user",
        content: initialMessage,
        timestamp: now,
        provider,
        model,
      });
    }

    // Generate better title using AI model info
    const aiGeneratedTitle = await generateSmartTitle(
      title,
      provider,
      model,
      initialMessage
    );

    return await ctx.db.insert("conversations", {
      projectId: finalProjectId,
      userId: user._id,
      title: aiGeneratedTitle,
      provider,
      model,
      aiGeneratedTitle: true,
      messages,
      createdAt: now,
      updatedAt: now,
      lastMessageAt: now,
      messageCount: messages.length,
      isPinned: false,
      isArchived: false,
      isDeleted: false,
      isFavorite: false,
    });
  },
});

// Helper function to generate smart titles using AI model info
async function generateSmartTitle(
  defaultTitle: string,
  provider: string,
  model: string,
  content?: string
): Promise<string> {
  if (content?.trim()?.length && content.trim().length > 3) {
    // Extract key words from content for a smarter title
    const words = content.trim().split(/\s+/).slice(0, 6).join(" ");
    const truncated =
      words.length > 50 ? `${words.substring(0, 47)}...` : words;

    // Add AI model context to title
    const modelName = model.split("/").pop()?.split("-").slice(-1)[0] || model;
    return `${truncated} • ${provider}/${modelName}`;
  }

  // Fallback with AI model info
  const modelName = model.split("/").pop()?.split("-").slice(-1)[0] || model;
  return `${defaultTitle} • ${provider}/${modelName}`;
}

// Add message to conversation (replaces old messages.add)
export const addMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    role: v.string(),
    content: v.string(),
    provider: v.optional(v.string()),
    model: v.optional(v.string()),
    attachments: v.optional(
      v.array(
        v.object({
          id: v.string(),
          name: v.string(),
          url: v.string(),
          type: v.string(),
          size: v.number(),
        })
      )
    ),
    tokenCount: v.optional(v.number()),
    inferenceSpeed: v.optional(v.number()),
    toolsUsed: v.optional(
      v.array(
        v.object({
          name: v.string(),
          duration: v.optional(v.number()),
          metadata: v.optional(v.any()),
        })
      )
    ),
  },
  handler: async (
    ctx,
    {
      conversationId,
      role,
      content,
      provider,
      model,
      attachments,
      tokenCount,
      inferenceSpeed,
      toolsUsed,
    }
  ) => {
    const user = await requireUser(ctx);

    const conversation = await ctx.db.get(conversationId);
    if (!conversation || conversation.userId !== user._id) {
      throw new Error("Conversation not found");
    }

    const now = Date.now();
    const messageId = nanoid();

    const newMessage = {
      id: messageId,
      role,
      content,
      timestamp: now,
      // Use provided provider/model or fall back to conversation defaults
      provider: provider || conversation.provider,
      model: model || conversation.model,
      ...(attachments && { attachments }),
      ...(tokenCount && { tokenCount }),
      ...(inferenceSpeed && { inferenceSpeed }),
      ...(toolsUsed && { toolsUsed }),
      // Add response timing for stats
      ...(role === "assistant" && {
        responseStartTime: now,
        responseEndTime: now,
      }),
    };

    const updatedMessages = [...(conversation.messages || []), newMessage];

    // Calculate stats
    const totalTokens = updatedMessages.reduce(
      (sum, msg) => sum + (msg.tokenCount || 0),
      0
    );
    const speeds = updatedMessages
      .map((msg) => msg.inferenceSpeed)
      .filter(Boolean) as number[];
    const avgInferenceSpeed =
      speeds.length > 0
        ? speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length
        : undefined;

    await ctx.db.patch(conversationId, {
      messages: updatedMessages,
      messageCount: updatedMessages.length,
      lastMessageAt: now,
      updatedAt: now,
      ...(totalTokens > 0 && { totalTokens }),
      ...(avgInferenceSpeed && { avgInferenceSpeed }),
    });

    return messageId;
  },
});

// Update a specific message in a conversation
export const updateMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    messageId: v.string(),
    content: v.string(),
  },
  handler: async (ctx, { conversationId, messageId, content }) => {
    const user = await requireUser(ctx);

    const conversation = await ctx.db.get(conversationId);
    if (!conversation || conversation.userId !== user._id) {
      throw new Error("Conversation not found");
    }

    const messages = conversation.messages || [];
    const messageIndex = messages.findIndex((msg) => msg.id === messageId);

    if (messageIndex === -1) {
      throw new Error("Message not found");
    }

    // Update the message content
    const updatedMessages = [...messages];
    const messageToUpdate = updatedMessages[messageIndex];
    if (!messageToUpdate) {
      throw new Error("Message not found in array");
    }

    updatedMessages[messageIndex] = {
      ...messageToUpdate,
      content,
    };

    await ctx.db.patch(conversationId, {
      messages: updatedMessages,
      updatedAt: Date.now(),
    });

    return messageId;
  },
});

// Delete messages from a specific point in a conversation (for retry functionality)
export const deleteMessagesFromPoint = mutation({
  args: {
    conversationId: v.id("conversations"),
    fromMessageId: v.string(),
  },
  handler: async (ctx, { conversationId, fromMessageId }) => {
    const user = await requireUser(ctx);

    const conversation = await ctx.db.get(conversationId);
    if (!conversation || conversation.userId !== user._id) {
      throw new Error("Conversation not found");
    }

    const messages = conversation.messages || [];
    const fromIndex = messages.findIndex((msg) => msg.id === fromMessageId);

    if (fromIndex === -1) {
      throw new Error("Message not found");
    }

    // Keep only messages up to (and including) the specified message
    const updatedMessages = messages.slice(0, fromIndex + 1);

    await ctx.db.patch(conversationId, {
      messages: updatedMessages,
      messageCount: updatedMessages.length,
      lastMessageAt:
        updatedMessages[updatedMessages.length - 1]?.timestamp || Date.now(),
      updatedAt: Date.now(),
    });

    return updatedMessages.length;
  },
});

// Update conversation title and metadata
export const update = mutation({
  args: {
    conversationId: v.id("conversations"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    isPinned: v.optional(v.boolean()),
    isArchived: v.optional(v.boolean()),
    isFavorite: v.optional(v.boolean()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (
    ctx,
    {
      conversationId,
      title,
      description,
      isPinned,
      isArchived,
      isFavorite,
      tags,
    }
  ) => {
    const user = await requireUser(ctx);

    const conversation = await ctx.db.get(conversationId);
    if (!conversation || conversation.userId !== user._id) {
      throw new Error("Conversation not found");
    }

    const updates: Record<string, unknown> = {
      updatedAt: Date.now(),
    };

    if (title !== undefined) {
      updates.title = title;
      updates.aiGeneratedTitle = false; // User manually set title
    }
    if (description !== undefined) updates.description = description;
    if (isPinned !== undefined) updates.isPinned = isPinned;
    if (isArchived !== undefined) updates.isArchived = isArchived;
    if (isFavorite !== undefined) updates.isFavorite = isFavorite;
    if (tags !== undefined) updates.tags = tags;

    await ctx.db.patch(conversationId, updates);
  },
});

// Branch a conversation from a specific message
export const branch = mutation({
  args: {
    originalConversationId: v.id("conversations"),
    fromMessageId: v.string(),
    newTitle: v.optional(v.string()),
    branchTitle: v.optional(v.string()),
  },
  handler: async (
    ctx,
    { originalConversationId, fromMessageId, newTitle, branchTitle }
  ) => {
    const user = await requireUser(ctx);

    const originalConversation = await ctx.db.get(originalConversationId);
    if (!originalConversation || originalConversation.userId !== user._id) {
      throw new Error("Original conversation not found");
    }

    // Find the message to branch from
    const messages = originalConversation.messages || [];
    const fromMessageIndex = messages.findIndex(
      (msg) => msg.id === fromMessageId
    );

    if (fromMessageIndex === -1) {
      throw new Error("Branch point message not found");
    }

    const now = Date.now();

    // Copy messages up to and including the branch point
    const branchedMessages = messages.slice(0, fromMessageIndex + 1);

    const branchedConversationId = await ctx.db.insert("conversations", {
      projectId: originalConversation.projectId,
      userId: user._id,
      title: newTitle || `${originalConversation.title} (Branch)`,
      description: branchTitle,
      provider: originalConversation.provider,
      model: originalConversation.model,
      aiGeneratedTitle: false,
      messages: branchedMessages,
      createdAt: now,
      updatedAt: now,
      lastMessageAt:
        branchedMessages[branchedMessages.length - 1]?.timestamp || now,
      messageCount: branchedMessages.length,
      branchedFrom: originalConversationId,
      branchFromMessageId: fromMessageId,
      branchTitle,
      isPinned: false,
      isArchived: false,
      isDeleted: false,
      isFavorite: false,
    });

    return branchedConversationId;
  },
});

// Soft delete a conversation
export const remove = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, { conversationId }) => {
    const user = await requireUser(ctx);

    const conversation = await ctx.db.get(conversationId);
    if (!conversation || conversation.userId !== user._id) {
      throw new Error("Conversation not found");
    }

    await ctx.db.patch(conversationId, {
      isDeleted: true,
      updatedAt: Date.now(),
    });
  },
});

// Search conversations and their messages
export const search = query({
  args: {
    query: v.string(),
    projectId: v.optional(v.id("projects")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { query, projectId, limit = 20 }) => {
    const user = await requireUser(ctx);

    if (!query.trim()) {
      return [];
    }

    let conversations = await ctx.db
      .query("conversations")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Filter by project if specified
    if (projectId) {
      conversations = conversations.filter((c) => c.projectId === projectId);
    }

    // Filter by search query in title or message content
    const searchResults = conversations
      .filter((conversation) => {
        if (conversation.isDeleted) return false;

        const titleMatch = conversation.title
          .toLowerCase()
          .includes(query.toLowerCase());
        const messageMatch = (conversation.messages || []).some((msg) =>
          msg.content.toLowerCase().includes(query.toLowerCase())
        );

        return titleMatch || messageMatch;
      })
      .sort((a, b) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0))
      .slice(0, limit);

    return searchResults;
  },
});

// Auto-rename conversation based on content using AI model
export const autoRename = mutation({
  args: {
    conversationId: v.id("conversations"),
    content: v.string(),
  },
  handler: async (ctx, { conversationId, content }) => {
    const user = await requireUser(ctx);

    const conversation = await ctx.db.get(conversationId);
    if (!conversation || conversation.userId !== user._id) {
      throw new Error("Conversation not found");
    }

    // Skip if user has manually set title
    if (conversation.aiGeneratedTitle === false) {
      return;
    }

    const newTitle = await generateSmartTitle(
      conversation.title,
      conversation.provider,
      conversation.model,
      content
    );

    await ctx.db.patch(conversationId, {
      title: newTitle,
      aiGeneratedTitle: true,
      updatedAt: Date.now(),
    });

    return newTitle;
  },
});

// Get user statistics for "Stats for Nerds"
export const getUserStats = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);

    const conversations = await ctx.db
      .query("conversations")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("isDeleted"), false))
      .collect();

    let totalTokens = 0;
    let totalMessages = 0;
    let totalResponseTime = 0;
    let assistantMessages = 0;

    conversations.forEach((conversation) => {
      const messages = conversation.messages || [];
      totalMessages += messages.length;

      messages.forEach((message) => {
        if (message.tokenCount) {
          totalTokens += message.tokenCount;
        }

        if (message.role === "assistant") {
          assistantMessages++;
          if (message.responseStartTime && message.responseEndTime) {
            totalResponseTime +=
              (message.responseEndTime - message.responseStartTime) / 1000; // Convert to seconds
          }
        }
      });
    });

    const avgResponseTime =
      assistantMessages > 0 ? totalResponseTime / assistantMessages : 0;
    const tokensPerSecond =
      totalResponseTime > 0 ? totalTokens / totalResponseTime : 0;

    return {
      totalTokens,
      totalMessages,
      totalConversations: conversations.length,
      avgResponseTime: Number(avgResponseTime.toFixed(2)),
      tokensPerSecond: Number(tokensPerSecond.toFixed(2)),
      assistantMessages,
    };
  },
});
