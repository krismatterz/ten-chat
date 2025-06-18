import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./auth";

// Get all projects for the current user
export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);

    return await ctx.db
      .query("projects")
      .withIndex("by_user_updated", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();
  },
});

// Get user's default project
export const getDefault = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);

    let defaultProject = await ctx.db
      .query("projects")
      .withIndex("by_default", (q) =>
        q.eq("userId", user._id).eq("isDefault", true)
      )
      .first();

    // Return null if no default project exists - it will be created by mutation
    if (!defaultProject) {
      return null;
    }

    return defaultProject;
  },
});

// Create default project
export const createDefault = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);

    // Check if default project already exists
    const existingDefault = await ctx.db
      .query("projects")
      .withIndex("by_default", (q) =>
        q.eq("userId", user._id).eq("isDefault", true)
      )
      .first();

    if (existingDefault) {
      return existingDefault._id;
    }

    const now = Date.now();
    return await ctx.db.insert("projects", {
      name: "Personal",
      description: "Default workspace for personal conversations",
      icon: "💬",
      color: "#3b82f6",
      userId: user._id,
      isDefault: true,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Create a new project
export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, { name, description, icon, color }) => {
    const user = await requireUser(ctx);

    const now = Date.now();
    return await ctx.db.insert("projects", {
      name,
      description,
      icon: icon || "📁",
      color: color || "#6b7280",
      userId: user._id,
      isDefault: false,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update a project
export const update = mutation({
  args: {
    projectId: v.id("projects"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, { projectId, name, description, icon, color }) => {
    const user = await requireUser(ctx);

    const project = await ctx.db.get(projectId);
    if (!project || project.userId !== user._id) {
      throw new Error("Project not found");
    }

    const updates: Record<string, unknown> = {
      updatedAt: Date.now(),
    };

    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (icon !== undefined) updates.icon = icon;
    if (color !== undefined) updates.color = color;

    await ctx.db.patch(projectId, updates);
  },
});

// Archive a project
export const archive = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    const user = await requireUser(ctx);

    const project = await ctx.db.get(projectId);
    if (!project || project.userId !== user._id) {
      throw new Error("Project not found");
    }

    if (project.isDefault) {
      throw new Error("Cannot archive default project");
    }

    await ctx.db.patch(projectId, {
      isArchived: true,
      updatedAt: Date.now(),
    });
  },
});

// Delete a project (and all its conversations)
export const remove = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    const user = await requireUser(ctx);

    const project = await ctx.db.get(projectId);
    if (!project || project.userId !== user._id) {
      throw new Error("Project not found");
    }

    if (project.isDefault) {
      throw new Error("Cannot delete default project");
    }

    // Delete all conversations in this project
    const conversations = await ctx.db
      .query("conversations")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect();

    for (const conversation of conversations) {
      await ctx.db.delete(conversation._id);
    }

    // Delete the project
    await ctx.db.delete(projectId);
  },
});
