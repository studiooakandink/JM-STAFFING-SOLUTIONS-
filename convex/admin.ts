import {
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { v } from "convex/values";

export const listForAdmin = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("customerEnquiries")
      .withIndex("by_createdAt")
      .order("desc")
      .collect();
  },
});

export const storeSession = internalMutation({
  args: {
    sessionId: v.string(),
    expiresAt: v.number(),
    csrfToken: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("adminSessions")
      .withIndex("by_sessionId", (q) =>
        q.eq("sessionId", args.sessionId),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        expiresAt: args.expiresAt,
        csrfToken: args.csrfToken,
      });
    } else {
      await ctx.db.insert("adminSessions", args);
    }

    return true;
  },
});

export const getSession = internalQuery({
  args: {
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("adminSessions")
      .withIndex("by_sessionId", (q) =>
        q.eq("sessionId", args.sessionId),
      )
      .unique();

    if (!session || Date.now() >= session.expiresAt) {
      return null;
    }

    return {
      expiresAt: session.expiresAt,
      csrfToken: session.csrfToken,
    };
  },
});

export const deleteSession = internalMutation({
  args: {
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("adminSessions")
      .withIndex("by_sessionId", (q) =>
        q.eq("sessionId", args.sessionId),
      )
      .unique();

    if (!session) return false;

    await ctx.db.delete(session._id);
    return true;
  },
});
