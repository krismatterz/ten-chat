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

    // Create new user
    return await ctx.db.insert("users", {
      clerkId,
      email,
      name,
      avatar,
      createdAt: now,
      lastActiveAt: now,
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
