import type { Auth } from "convex/server";

export async function getCurrentUser(ctx: { db: any; auth: Auth }) {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    // Return demo user in development if no auth
    if (process.env.NODE_ENV === "development") {
      const demoUser = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", "demo-user"))
        .first();

      if (demoUser) {
        return demoUser;
      }

      // Create demo user if it doesn't exist
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
    // Update last active time
    await ctx.db.patch(existingUser._id, {
      lastActiveAt: Date.now(),
    });
    return existingUser;
  }

  // Create new user
  const now = Date.now();
  const userId = await ctx.db.insert("users", {
    clerkId,
    email: identity.email || "",
    name: identity.name || "User",
    avatar: identity.pictureUrl,
    createdAt: now,
    lastActiveAt: now,
  });

  return await ctx.db.get(userId);
}

export async function requireUser(ctx: { db: any; auth: Auth }) {
  const user = await getCurrentUser(ctx);
  if (!user) {
    throw new Error("Authentication required");
  }
  return user;
}
