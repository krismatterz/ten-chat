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
    attachments: v.optional(
      v.array(
        v.object({
          name: v.string(),
          url: v.string(),
          type: v.string(),
          size: v.number(),
        })
      )
    ),
  },
  handler: async (
    ctx,
    { conversationId, role, content, model, provider, tokens, attachments }
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
      attachments,
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
      // Return empty array instead of throwing error for deleted conversations
      return [];
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

// Search messages across all conversations for the current user
export const search = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { query, limit = 50 }) => {
    const user = await requireUser(ctx);

    if (!query.trim()) {
      return [];
    }

    // Get all user conversations first
    const userConversations = await ctx.db
      .query("conversations")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const conversationIds = userConversations.map((conv) => conv._id);

    // Search messages across user's conversations
    const allMessages = await ctx.db.query("messages").collect();

    // Filter messages that belong to user's conversations and match search query
    const searchResults = allMessages
      .filter(
        (message) =>
          conversationIds.includes(message.conversationId) &&
          message.content.toLowerCase().includes(query.toLowerCase())
      )
      .sort((a, b) => b.timestamp - a.timestamp) // Most recent first
      .slice(0, limit);

    // Enrich with conversation data
    return await Promise.all(
      searchResults.map(async (message) => {
        const conversation = await ctx.db.get(message.conversationId);
        return {
          ...message,
          conversation: conversation
            ? {
                _id: conversation._id,
                title: conversation.title,
                provider: conversation.provider,
              }
            : null,
        };
      })
    );
  },
});

// Add or toggle a reaction to a message
export const addReaction = mutation({
  args: {
    messageId: v.id("messages"),
    emoji: v.string(),
  },
  handler: async (ctx, { messageId, emoji }) => {
    const user = await requireUser(ctx);

    const message = await ctx.db.get(messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    // Verify user has access to this conversation
    const conversation = await ctx.db.get(message.conversationId);
    if (!conversation || conversation.userId !== user._id) {
      throw new Error("Not authorized");
    }

    const reactions = message.reactions || [];

    // Check if user already reacted with this emoji
    const existingReactionIndex = reactions.findIndex(
      (r) => r.userId === user._id && r.emoji === emoji
    );

    if (existingReactionIndex >= 0) {
      // Remove existing reaction (toggle off)
      reactions.splice(existingReactionIndex, 1);
    } else {
      // Add new reaction
      reactions.push({
        emoji,
        userId: user._id,
        timestamp: Date.now(),
      });
    }

    await ctx.db.patch(messageId, { reactions });
  },
});

// Remove a reaction from a message
export const removeReaction = mutation({
  args: {
    messageId: v.id("messages"),
    emoji: v.string(),
  },
  handler: async (ctx, { messageId, emoji }) => {
    const user = await requireUser(ctx);

    const message = await ctx.db.get(messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    // Verify user has access to this conversation
    const conversation = await ctx.db.get(message.conversationId);
    if (!conversation || conversation.userId !== user._id) {
      throw new Error("Not authorized");
    }

    const reactions = message.reactions || [];
    const filteredReactions = reactions.filter(
      (r) => !(r.userId === user._id && r.emoji === emoji)
    );

    await ctx.db.patch(messageId, { reactions: filteredReactions });
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
