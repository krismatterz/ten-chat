import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Enhanced Users Table with preferences
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    avatar: v.optional(v.string()),

    // User Preferences
    defaultProvider: v.optional(v.string()),
    defaultModel: v.optional(v.string()),
    defaultReasoningLevel: v.optional(v.string()),
    theme: v.optional(v.string()),

    // Activity Tracking
    createdAt: v.float64(),
    lastActiveAt: v.float64(),
    totalConversations: v.optional(v.number()),
    totalMessages: v.optional(v.number()),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"])
    .index("by_last_active", ["lastActiveAt"]),

  // User preferences for customization
  userPreferences: defineTable({
    userId: v.id("users"),
    displayName: v.string(),
    jobTitle: v.string(),
    traits: v.array(v.string()),
    additionalInfo: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  // Projects for organization
  projects: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    color: v.optional(v.string()), // UI theme color
    icon: v.optional(v.string()), // emoji or icon name
    userId: v.id("users"),
    isDefault: v.boolean(),
    createdAt: v.float64(),
    updatedAt: v.float64(),
    isArchived: v.optional(v.boolean()),
  })
    .index("by_user", ["userId"])
    .index("by_user_updated", ["userId", "updatedAt"])
    .index("by_default", ["userId", "isDefault"]),

  // Consolidated Conversations Table
  conversations: defineTable({
    projectId: v.optional(v.id("projects")), // Optional for migration
    userId: v.id("users"),

    // Basic Info
    title: v.string(),
    description: v.optional(v.string()),

    // AI Configuration
    provider: v.string(), // anthropic, openai, etc.
    model: v.string(), // claude-3.5-sonnet, gpt-4o, etc.
    aiGeneratedTitle: v.optional(v.boolean()),

    // Messages (embedded array)
    messages: v.optional(
      v.array(
        v.object({
          id: v.string(), // unique message ID
          role: v.string(), // user, assistant, system
          content: v.string(),
          timestamp: v.float64(),

          // AI Metadata
          provider: v.optional(v.string()),
          model: v.optional(v.string()),
          tokenCount: v.optional(v.number()),
          inferenceSpeed: v.optional(v.number()), // tokens/second

          // Attachments
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

          // Tools Used
          toolsUsed: v.optional(
            v.array(
              v.object({
                name: v.string(), // web_tool, mcp_context7, etc.
                duration: v.optional(v.number()),
                metadata: v.optional(v.any()), // tool-specific data
              })
            )
          ),
        })
      )
    ),

    // Timestamps
    createdAt: v.float64(),
    updatedAt: v.float64(),
    lastMessageAt: v.optional(v.float64()), // Optional for migration

    // Organization
    isPinned: v.optional(v.boolean()),
    isArchived: v.optional(v.boolean()),
    isDeleted: v.optional(v.boolean()),
    isFavorite: v.optional(v.boolean()),

    // Branching
    branchedFrom: v.optional(v.id("conversations")),
    branchFromMessageId: v.optional(v.string()), // message ID within parent
    branchTitle: v.optional(v.string()),

    // Stats
    messageCount: v.optional(v.number()), // Optional for migration
    totalTokens: v.optional(v.number()),
    avgInferenceSpeed: v.optional(v.number()),

    // Tags
    tags: v.optional(v.array(v.string())),
  })
    .index("by_project", ["projectId"])
    .index("by_user", ["userId"])
    .index("by_user_updated", ["userId", "updatedAt"])
    .index("by_project_updated", ["projectId", "updatedAt"])
    .index("by_last_message", ["userId", "lastMessageAt"])
    .index("by_branched_from", ["branchedFrom"])
    .index("by_pinned", ["userId", "isPinned"])
    .index("by_favorite", ["userId", "isFavorite"]),

  // Centralized File Management
  files: defineTable({
    userId: v.id("users"),
    projectId: v.optional(v.id("projects")),

    // File Info
    name: v.string(),
    originalName: v.string(),
    url: v.string(),
    type: v.string(),
    size: v.number(),

    // Processing
    processedContent: v.optional(v.string()), // extracted text
    processingStatus: v.string(), // pending, processed, failed
    processingError: v.optional(v.string()),

    // Usage Tracking
    usedInConversations: v.array(v.id("conversations")),
    uploadedAt: v.float64(),
    lastUsedAt: v.optional(v.float64()),

    // Organization
    isArchived: v.optional(v.boolean()),
    tags: v.optional(v.array(v.string())),
  })
    .index("by_user", ["userId"])
    .index("by_project", ["projectId"])
    .index("by_type", ["userId", "type"])
    .index("by_uploaded", ["userId", "uploadedAt"])
    .index("by_processing_status", ["processingStatus"]),
});
