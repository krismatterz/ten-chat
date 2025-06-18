# Ten Chat Database Restructure Plan

## Overview

Consolidating the current dual-table structure (conversations + messages) into a single streamlined schema with better organization and additional features for an agentic chat experience.

## Current Issues

- ❌ Message duplication with Claude
- ❌ OpenRouter/Perplexity API integration issues
- ❌ Separate messages table causing complexity
- ❌ Missing project organization
- ❌ Limited metadata for AI interactions
- ❌ Chat titles not using selected AI model

## New Database Schema

### 1. **Projects Table** 🗂️

Central organization unit for user workspaces.

```typescript
projects: defineTable({
  id: v.id("projects"),
  userId: v.id("users"),
  name: v.string(),
  description: v.optional(v.string()),
  color: v.optional(v.string()), // UI theme color
  icon: v.optional(v.string()), // emoji or icon name
  isDefault: v.boolean(), // user's default project
  createdAt: v.float64(),
  updatedAt: v.float64(),
  isArchived: v.optional(v.boolean()),
});
```

### 2. **Consolidated Conversations Table** 💬

Single table containing all conversation data with embedded messages.

```typescript
conversations: defineTable({
  id: v.id("conversations"),
  projectId: v.id("projects"),
  userId: v.id("users"),

  // Basic Info
  title: v.string(), // AI-generated using selected model
  description: v.optional(v.string()),

  // AI Configuration
  provider: v.string(), // anthropic, openai, etc.
  model: v.string(), // claude-3.5-sonnet, gpt-4o, etc.
  aiGeneratedTitle: v.boolean(), // true if title was AI-generated

  // Messages (embedded array)
  messages: v.array(
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
  ),

  // Timestamps
  createdAt: v.float64(),
  updatedAt: v.float64(),
  lastMessageAt: v.float64(),

  // Organization
  isPinned: v.optional(v.boolean()),
  isArchived: v.optional(v.boolean()),
  isDeleted: v.optional(v.boolean()),
  isFavorite: v.optional(v.boolean()),

  // Branching
  branchedFrom: v.optional(v.id("conversations")),
  branchFromMessageId: v.optional(v.string()), // message ID within parent
  branchTitle: v.optional(v.string()), // custom branch description

  // Stats
  messageCount: v.number(),
  totalTokens: v.optional(v.number()),
  avgInferenceSpeed: v.optional(v.number()),

  // Tags
  tags: v.optional(v.array(v.string())),
});
```

### 3. **Enhanced Users Table** 👤

Extended user preferences and settings.

```typescript
users: defineTable({
  id: v.id("users"),
  clerkId: v.string(),
  email: v.string(),
  name: v.optional(v.string()),
  avatar: v.optional(v.string()),

  // Preferences
  defaultProvider: v.optional(v.string()),
  defaultModel: v.optional(v.string()),
  defaultReasoningLevel: v.optional(v.string()),
  theme: v.optional(v.string()),

  // Activity
  createdAt: v.float64(),
  lastActiveAt: v.float64(),
  totalConversations: v.number(),
  totalMessages: v.number(),
});
```

### 4. **Files Table** 📎

Centralized file management across projects.

```typescript
files: defineTable({
  id: v.id("files"),
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

  // Usage
  usedInConversations: v.array(v.id("conversations")),
  uploadedAt: v.float64(),
  lastUsedAt: v.optional(v.float64()),

  // Organization
  isArchived: v.optional(v.boolean()),
  tags: v.optional(v.array(v.string())),
});
```

## Migration Strategy

### Phase 1: Schema Migration ⚡

1. Create new tables
2. Migrate existing data
3. Update all queries
4. Remove old tables

### Phase 2: Feature Updates 🔧

1. Fix OpenRouter/Perplexity integration
2. Implement AI-generated titles
3. Add project organization
4. Fix chat duplication

### Phase 3: UI Updates 🎨

1. Project selector
2. Enhanced file management
3. Better conversation metadata
4. Analytics integration

## Implementation Benefits

### ✅ Solved Issues

- **No more duplication**: Single source of truth
- **Better performance**: Fewer database queries
- **Rich metadata**: Track AI performance and tool usage
- **Project organization**: Better file and conversation management
- **AI-generated titles**: Use selected model for naming

### 🚀 New Features

- **Advanced branching**: Better conversation forking
- **File management**: Centralized file handling
- **Performance tracking**: Token usage and inference speed
- **Tool integration**: Track MCP and web tool usage
- **Enhanced search**: Better conversation discovery

## Database Indexes

```typescript
// Projects
.index("by_user", ["userId"])
.index("by_user_updated", ["userId", "updatedAt"])

// Conversations
.index("by_project", ["projectId"])
.index("by_user", ["userId"])
.index("by_user_updated", ["userId", "updatedAt"])
.index("by_project_updated", ["projectId", "updatedAt"])
.index("by_last_message", ["userId", "lastMessageAt"])
.index("by_branched_from", ["branchedFrom"])

// Files
.index("by_user", ["userId"])
.index("by_project", ["projectId"])
.index("by_type", ["type"])
.index("by_uploaded", ["userId", "uploadedAt"])
```

## Next Steps

1. ✅ Create this plan
2. 🔄 Implement new schema
3. 🔄 Update API routes
4. 🔄 Update React components
5. 🔄 Add Vercel Analytics
6. 🔄 Test and deploy
