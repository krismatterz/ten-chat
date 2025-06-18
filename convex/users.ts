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

		// Delete all conversations for this user
		const conversations = await ctx.db
			.query("conversations")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.collect();

		for (const conversation of conversations) {
			// Delete all messages in each conversation
			const messages = await ctx.db
				.query("messages")
				.withIndex("by_conversation", (q) =>
					q.eq("conversationId", conversation._id)
				)
				.collect();

			for (const message of messages) {
				await ctx.db.delete(message._id);
			}

			// Delete the conversation
			await ctx.db.delete(conversation._id);
		}

		// Note: Files and settings tables removed from schema

		// Finally delete the user
		await ctx.db.delete(userId);

		return { success: true };
	},
});
