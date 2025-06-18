import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser, requireUser } from "./auth";

// Get all conversations for the current user
export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);

    return await ctx.db
      .query("conversations")
      .withIndex("by_user_updated", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();
  },
});

// Get a specific conversation with its messages
export const get = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, { conversationId }) => {
    const user = await requireUser(ctx);

    const conversation = await ctx.db.get(conversationId);
    if (!conversation || conversation.userId !== user._id) {
      throw new Error("Conversation not found");
    }

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation_timestamp", (q) =>
        q.eq("conversationId", conversationId)
      )
      .order("asc")
      .collect();

    return { conversation, messages };
  },
});

// Create a new conversation
export const create = mutation({
  args: {
    title: v.string(),
    model: v.string(),
    provider: v.string(),
  },
  handler: async (ctx, { title, model, provider }) => {
    const user = await requireUser(ctx);

    const now = Date.now();
    return await ctx.db.insert("conversations", {
      title,
      userId: user._id,
      createdAt: now,
      updatedAt: now,
      model: model || "claude-3-5-sonnet",
      provider: provider || "anthropic",
    });
  },
});

// Update conversation title
export const updateTitle = mutation({
  args: {
    conversationId: v.id("conversations"),
    title: v.string(),
  },
  handler: async (ctx, { conversationId, title }) => {
    const user = await requireUser(ctx);

    const conversation = await ctx.db.get(conversationId);
    if (!conversation || conversation.userId !== user._id) {
      throw new Error("Conversation not found");
    }

    await ctx.db.patch(conversationId, {
      title,
      updatedAt: Date.now(),
    });
  },
});

// Archive a conversation
export const archive = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, { conversationId }) => {
    const user = await requireUser(ctx);

    const conversation = await ctx.db.get(conversationId);
    if (!conversation || conversation.userId !== user._id) {
      throw new Error("Conversation not found");
    }

    await ctx.db.patch(conversationId, {
      isArchived: true,
      updatedAt: Date.now(),
    });
  },
});

// Update conversation (title, isPinned, etc.)
export const update = mutation({
  args: {
    conversationId: v.id("conversations"),
    title: v.optional(v.string()),
    isPinned: v.optional(v.boolean()),
    isArchived: v.optional(v.boolean()),
  },
  handler: async (ctx, { conversationId, title, isPinned, isArchived }) => {
    const user = await requireUser(ctx);

    const conversation = await ctx.db.get(conversationId);
    if (!conversation || conversation.userId !== user._id) {
      throw new Error("Conversation not found");
    }

    const updates: Record<string, unknown> = {
      updatedAt: Date.now(),
    };

    if (title !== undefined) updates.title = title;
    if (isPinned !== undefined) updates.isPinned = isPinned;
    if (isArchived !== undefined) updates.isArchived = isArchived;

    await ctx.db.patch(conversationId, updates);
  },
});

// Delete a conversation completely
export const remove = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, { conversationId }) => {
    const user = await requireUser(ctx);

    const conversation = await ctx.db.get(conversationId);
    if (!conversation || conversation.userId !== user._id) {
      throw new Error("Conversation not found");
    }

    // Delete all messages in this conversation first
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation_timestamp", (q) =>
        q.eq("conversationId", conversationId)
      )
      .collect();

    for (const message of messages) {
      await ctx.db.delete(message._id);
    }

    // Then delete the conversation
    await ctx.db.delete(conversationId);
  },
});

// Auto-rename conversation based on content
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

    // Skip if already has a custom title (not starting with "New Chat")
    if (!conversation.title.startsWith("New Chat")) {
      return;
    }

    // Generate a simple title from content (first few words)
    const words = content
      .trim()
      .split(/\s+/)
      .slice(0, 5) // Max 5 words
      .join(" ");

    const title =
      words.length > 50 ? words.substring(0, 47) + "..." : words || "New Chat";

    await ctx.db.patch(conversationId, {
      title,
      updatedAt: Date.now(),
    });

    return title;
  },
});

// Branch a conversation from a specific message
export const branch = mutation({
  args: {
    originalConversationId: v.id("conversations"),
    fromMessageId: v.id("messages"),
    newTitle: v.optional(v.string()),
  },
  handler: async (ctx, { originalConversationId, fromMessageId, newTitle }) => {
    const user = await requireUser(ctx);

    // Verify user owns the original conversation
    const originalConversation = await ctx.db.get(originalConversationId);
    if (!originalConversation || originalConversation.userId !== user._id) {
      throw new Error("Original conversation not found");
    }

    // Get the message to branch from
    const fromMessage = await ctx.db.get(fromMessageId);
    if (!fromMessage || fromMessage.conversationId !== originalConversationId) {
      throw new Error("Message not found in conversation");
    }

    const now = Date.now();

    // Create new branched conversation
    const branchedConversationId = await ctx.db.insert("conversations", {
      title: newTitle || `${originalConversation.title} (Branch)`,
      userId: user._id,
      createdAt: now,
      updatedAt: now,
      model: originalConversation.model,
      provider: originalConversation.provider,
      branchedFrom: originalConversationId,
      branchFromMessageId: fromMessageId,
    });

    // Copy all messages up to and including the branch point
    const originalMessages = await ctx.db
      .query("messages")
      .withIndex("by_conversation_timestamp", (q) =>
        q.eq("conversationId", originalConversationId)
      )
      .order("asc")
      .collect();

    // Find the index of the message we're branching from
    const branchIndex = originalMessages.findIndex(
      (msg) => msg._id === fromMessageId
    );

    if (branchIndex === -1) {
      throw new Error("Branch point message not found");
    }

    // Copy messages up to and including the branch point
    const messagesToCopy = originalMessages.slice(0, branchIndex + 1);

    for (const message of messagesToCopy) {
      await ctx.db.insert("messages", {
        conversationId: branchedConversationId,
        role: message.role,
        content: message.content,
        timestamp: message.timestamp,
        model: message.model,
        provider: message.provider,
        attachments: message.attachments,
      });
    }

    return branchedConversationId;
  },
});
