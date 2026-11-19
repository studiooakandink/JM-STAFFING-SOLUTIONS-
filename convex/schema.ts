import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  customerEnquiries: defineTable({
    fullName: v.string(),
    email: v.string(),
    phone: v.string(),
    eventType: v.string(),
    eventDate: v.string(),
    guestCount: v.union(v.number(), v.null()),
    message: v.string(),
    status: v.union(
      v.literal("New"),
      v.literal("Contacted"),
      v.literal("Quoted"),
      v.literal("Booked"),
      v.literal("Closed"),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_createdAt", ["createdAt"])
    .index("by_status", ["status"])
    .index("by_email", ["email"]),

  adminSessions: defineTable({
    sessionId: v.string(),
    expiresAt: v.number(),
    csrfToken: v.string(),
  })
    .index("by_sessionId", ["sessionId"])
    .index("by_expiresAt", ["expiresAt"]),
});
