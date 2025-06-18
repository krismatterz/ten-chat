import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    avatar: v.optional(v.string()),
    createdAt: v.float64(),
    lastActiveAt: v.float64(),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"]),

  conversations: defineTable({
    branchFromMessageId: v.optional(v.id("messages")),
    branchedFrom: v.optional(v.id("conversations")),
    createdAt: v.float64(),
    isArchived: v.optional(v.boolean()),
    isPinned: v.optional(v.boolean()),
    model: v.string(),
    provider: v.string(),
    title: v.string(),
    updatedAt: v.float64(),
    userId: v.id("users"),
  })
    .index("by_user", ["userId"])
    .index("by_user_updated", ["userId", "updatedAt"])
    .index("by_branched_from", ["branchedFrom"]),

  messages: defineTable({
    attachments: v.optional(
      v.array(
        v.object({
          name: v.string(),
          size: v.float64(),
          type: v.string(),
          url: v.string(),
        })
      )
    ),
    content: v.string(),
    conversationId: v.id("conversations"),
    model: v.optional(v.string()),
    provider: v.optional(v.string()),
    role: v.string(),
    timestamp: v.float64(),
  })
    .index("by_conversation", ["conversationId"])
    .index("by_conversation_timestamp", ["conversationId", "timestamp"]),
});
