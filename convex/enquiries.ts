import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const submit = mutation({
  args: {
    fullName: v.string(),
    email: v.string(),
    phone: v.string(),
    eventType: v.string(),
    eventDate: v.string(),
    guestCount: v.union(v.number(), v.null()),
    message: v.string(),
  },

  handler: async (ctx, args) => {
    const fullName = args.fullName.trim();
    const email = args.email.trim().toLowerCase();
    const phone = args.phone.trim();
    const eventType = args.eventType.trim();
    const message = args.message.trim();

    if (!fullName || fullName.length > 150) {
      throw new Error("Please enter a valid full name.");
    }

    if (
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      throw new Error("Please enter a valid email address.");
    }

    if (phone.length > 40) {
      throw new Error("Please check your phone number.");
    }

    if (!eventType || eventType.length > 100) {
      throw new Error("Please select a valid event type.");
    }

    if (args.eventDate.length > 30) {
      throw new Error("Please check your event date.");
    }

    if (
      args.guestCount !== null &&
      (!Number.isInteger(args.guestCount) || args.guestCount < 1)
    ) {
      throw new Error("Please enter a valid guest count.");
    }

    if (message.length > 5000) {
      throw new Error("Your message is too long.");
    }

    const now = Date.now();

    return await ctx.db.insert("customerEnquiries", {
      fullName,
      email,
      phone,
      eventType,
      eventDate: args.eventDate,
      guestCount: args.guestCount,
      message,
      status: "New",
      createdAt: now,
      updatedAt: now,
    });
  },
});
