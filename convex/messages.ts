import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser, requireUser } from "./auth";

// Add a message to a conversation
export const add = mutation({
  args: {
    conversationId: v.id("conversations"),
    role: v.union(
      v.literal("user"),
      v.literal("assistant"),
      v.literal("system")
    ),
    content: v.string(),
    model: v.optional(v.string()),
    provider: v.optional(v.string()),
    tokens: v.optional(v.number()),
  },
  handler: async (
    ctx,
    { conversationId, role, content, model, provider, tokens }
  ) => {
    const user = await requireUser(ctx);

    // Verify user owns the conversation
    const conversation = await ctx.db.get(conversationId);
    if (!conversation || conversation.userId !== user._id) {
      throw new Error("Conversation not found");
    }

    const timestamp = Date.now();

    // Insert the message
    const messageId = await ctx.db.insert("messages", {
      conversationId,
      role,
      content,
      timestamp,
      model,
      provider,
      tokens,
    });

    // Update conversation's updatedAt timestamp
    await ctx.db.patch(conversationId, {
      updatedAt: timestamp,
    });

    return messageId;
  },
});

// Get messages for a conversation
export const list = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, { conversationId }) => {
    const user = await requireUser(ctx);

    // Verify user owns the conversation
    const conversation = await ctx.db.get(conversationId);
    if (!conversation || conversation.userId !== user._id) {
      throw new Error("Conversation not found");
    }

    return await ctx.db
      .query("messages")
      .withIndex("by_conversation_timestamp", (q) =>
        q.eq("conversationId", conversationId)
      )
      .order("asc")
      .collect();
  },
});

// Delete a message
export const remove = mutation({
  args: { messageId: v.id("messages") },
  handler: async (ctx, { messageId }) => {
    const user = await requireUser(ctx);

    const message = await ctx.db.get(messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    // Verify user owns the conversation
    const conversation = await ctx.db.get(message.conversationId);
    if (!conversation || conversation.userId !== user._id) {
      throw new Error("Not authorized");
    }

    await ctx.db.delete(messageId);
  },
});
