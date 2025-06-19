import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser, requireUser } from "./auth";

// Get or create the current user
export const current = query({
  args: {},
  handler: async (ctx) => {
    return await getCurrentUser(ctx);
  },
});

// Create or update user when they sign in
export const upsert = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    avatar: v.optional(v.string()),
  },
  handler: async (ctx, { clerkId, email, name, avatar }) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .first();

    const now = Date.now();

    if (existingUser) {
      // Update existing user
      await ctx.db.patch(existingUser._id, {
        email,
        name,
        avatar,
        lastActiveAt: now,
      });
      return existingUser._id;
    }

    // Create new user with default values
    return await ctx.db.insert("users", {
      clerkId,
      email,
      name,
      avatar,
      createdAt: now,
      lastActiveAt: now,
      totalConversations: 0,
      totalMessages: 0,
    });
  },
});

// Update user profile
export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    avatar: v.optional(v.string()),
  },
  handler: async (ctx, { name, avatar }) => {
    const user = await requireUser(ctx);

    await ctx.db.patch(user._id, {
      name,
      avatar,
      lastActiveAt: Date.now(),
    });
  },
});

// Update user's last active timestamp
export const updateLastActive = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);

    await ctx.db.patch(user._id, {
      lastActiveAt: Date.now(),
    });
  },
});

// Create demo user for development
export const createDemo = mutation({
  args: {},
  handler: async (ctx) => {
    const existingDemoUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", "demo-user"))
      .first();

    if (existingDemoUser) {
      return existingDemoUser;
    }

    const now = Date.now();
    const userId = await ctx.db.insert("users", {
      clerkId: "demo-user",
      email: "demo@tenchat.dev",
      name: "Demo User",
      createdAt: now,
      lastActiveAt: now,
      totalConversations: 0,
      totalMessages: 0,
    });

    return await ctx.db.get(userId);
  },
});

// Remove a user
export const remove = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    // Get the user to ensure it exists
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Delete all conversations for this user (messages are embedded, so they'll be deleted too)
    const conversations = await ctx.db
      .query("conversations")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    for (const conversation of conversations) {
      await ctx.db.delete(conversation._id);
    }

    // Note: Files and settings tables removed from schema

    // Finally delete the user
    await ctx.db.delete(userId);

    return { success: true };
  },
});

// Get user preferences
export const getPreferences = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);

    // Get existing preferences
    const existingPrefs = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (existingPrefs) {
      return existingPrefs;
    }

    // Return default preferences if none exist
    return {
      userId: user._id,
      displayName: user.name || "User",
      jobTitle: "",
      traits: ["helpful", "concise"],
      additionalInfo: "",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  },
});

// Update user preferences
export const updatePreferences = mutation({
  args: {
    displayName: v.optional(v.string()),
    jobTitle: v.optional(v.string()),
    traits: v.optional(v.array(v.string())),
    additionalInfo: v.optional(v.string()),
  },
  handler: async (ctx, { displayName, jobTitle, traits, additionalInfo }) => {
    const user = await requireUser(ctx);

    const existingPrefs = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    const now = Date.now();
    const updates: any = { updatedAt: now };

    if (displayName !== undefined) updates.displayName = displayName;
    if (jobTitle !== undefined) updates.jobTitle = jobTitle;
    if (traits !== undefined) updates.traits = traits;
    if (additionalInfo !== undefined) updates.additionalInfo = additionalInfo;

    if (existingPrefs) {
      await ctx.db.patch(existingPrefs._id, updates);
      return existingPrefs._id;
    } else {
      return await ctx.db.insert("userPreferences", {
        userId: user._id,
        displayName: displayName || user.name || "User",
        jobTitle: jobTitle || "",
        traits: traits || ["helpful", "concise"],
        additionalInfo: additionalInfo || "",
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});
