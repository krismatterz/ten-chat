import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    avatar: v.optional(v.string()),
    createdAt: v.number(),
    lastActiveAt: v.number(),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"]),

  conversations: defineTable({
    title: v.string(),
    userId: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
    isArchived: v.optional(v.boolean()),
    isPinned: v.optional(v.boolean()),
    model: v.optional(v.string()),
    provider: v.optional(v.string()),
    branchedFrom: v.optional(v.id("conversations")),
    branchFromMessageId: v.optional(v.id("messages")),
  })
    .index("by_user", ["userId"])
    .index("by_user_updated", ["userId", "updatedAt"])
    .index("by_branched_from", ["branchedFrom"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    role: v.union(
      v.literal("user"),
      v.literal("assistant"),
      v.literal("system")
    ),
    content: v.string(),
    timestamp: v.number(),
    tokens: v.optional(v.number()),
    model: v.optional(v.string()),
    provider: v.optional(v.string()),
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
    reactions: v.optional(
      v.array(
        v.object({
          emoji: v.string(),
          userId: v.id("users"),
          timestamp: v.number(),
        })
      )
    ),
  })
    .index("by_conversation", ["conversationId"])
    .index("by_conversation_timestamp", ["conversationId", "timestamp"]),

  files: defineTable({
    userId: v.id("users"),
    conversationId: v.optional(v.id("conversations")),
    name: v.string(),
    type: v.string(),
    size: v.number(),
    url: v.string(),
    uploadedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_conversation", ["conversationId"]),

  settings: defineTable({
    userId: v.id("users"),
    defaultModel: v.optional(v.string()),
    defaultProvider: v.optional(v.string()),
    theme: v.optional(
      v.union(v.literal("light"), v.literal("dark"), v.literal("system"))
    ),
    sidebarCollapsed: v.optional(v.boolean()),
    customInstructions: v.optional(v.string()),
  }).index("by_user", ["userId"]),
});
