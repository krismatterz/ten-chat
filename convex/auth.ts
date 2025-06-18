export async function getCurrentUser(ctx: { db: any }) {
  // Demo user for development - will be replaced with real auth in Stage 2
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
    avatar: null,
    createdAt: now,
    lastActiveAt: now,
  });

  return await ctx.db.get(userId);
}

export async function requireUser(ctx: { db: any }) {
  const user = await getCurrentUser(ctx);
  if (!user) {
    throw new Error("Demo user creation failed");
  }
  return user;
}
