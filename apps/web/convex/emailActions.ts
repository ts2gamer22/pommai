import { action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

/**
 * Action to send verification email - callable from auth callbacks
 */
export const sendVerificationEmail = action({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
    verificationUrl: v.string(),
  },
  handler: async (ctx, args): Promise<any> => {
    return await ctx.runMutation(internal.emails.sendVerificationEmail, args);
  },
});

/**
 * Action to send password reset email - callable from auth callbacks
 */
export const sendPasswordResetEmail = action({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
    resetUrl: v.string(),
  },
  handler: async (ctx, args): Promise<any> => {
    return await ctx.runMutation(internal.emails.sendPasswordResetEmail, args);
  },
});

/**
 * Action to send welcome email - callable from auth callbacks
 */
export const sendWelcomeEmail = action({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<any> => {
    return await ctx.runMutation(internal.emails.sendWelcomeEmail, args);
  },
});
