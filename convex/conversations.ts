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
    model: v.optional(v.string()),
    provider: v.optional(v.string()),
  },
  handler: async (ctx, { title, model, provider }) => {
    const user = await requireUser(ctx);

    const now = Date.now();
    return await ctx.db.insert("conversations", {
      title,
      userId: user._id,
      createdAt: now,
      updatedAt: now,
      model,
      provider,
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
