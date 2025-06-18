import type { Auth } from "convex/server";
import { mutation } from "./_generated/server";

export async function getCurrentUser(ctx: { db: any; auth?: Auth }) {
	const identity = ctx.auth ? await ctx.auth.getUserIdentity() : null;

	if (!identity) {
		return null;
	}

	// Get the Clerk user ID
	const clerkId = identity.subject;

	// Look up the user by Clerk ID
	const existingUser = await ctx.db
		.query("users")
		.withIndex("by_clerk_id", (q: any) => q.eq("clerkId", clerkId))
		.first();

	if (existingUser) {
		return existingUser;
	}

	// If user doesn't exist and we're in a query context, return null
	// User creation should happen via a mutation
	return null;
}

export async function requireUser(ctx: { db: any; auth?: Auth }) {
	const user = await getCurrentUser(ctx);
	if (!user) {
		throw new Error("Authentication required");
	}
	return user;
}

// Mutation to create demo user for development
export async function createDemoUser(ctx: { db: any }) {
	const existingDemoUser = await ctx.db
		.query("users")
		.withIndex("by_clerk_id", (q: any) => q.eq("clerkId", "demo-user"))
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
}

// Mutation to create or update user when they sign in with Clerk
export const upsertFromClerk = mutation({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Not authenticated");
		}

		const clerkId = identity.subject;

		// Check if user already exists
		const existingUser = await ctx.db
			.query("users")
			.withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
			.first();

		const now = Date.now();

		if (existingUser) {
			// Update existing user
			await ctx.db.patch(existingUser._id, {
				name: identity.name || existingUser.name,
				email: identity.email || existingUser.email,
				avatar: identity.pictureUrl || existingUser.avatar,
				lastActiveAt: now,
			});
			return existingUser._id;
		}

		// Create new user
		return await ctx.db.insert("users", {
			clerkId,
			email: identity.email || "",
			name: identity.name || "User",
			avatar: identity.pictureUrl,
			createdAt: now,
			lastActiveAt: now,
		});
	},
});
