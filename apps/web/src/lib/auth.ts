import { convexAdapter } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { requireEnv } from "@convex-dev/better-auth/utils";
import { betterAuth } from "better-auth";
import { betterAuthComponent } from "../../convex/auth";
import { type GenericCtx } from "../../convex/_generated/server";
import { api } from "../../convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";

const siteUrl = requireEnv("SITE_URL");

// Function to get Convex client - created on demand
const getConvexClient = () => {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL || "";
  if (!convexUrl) {
    console.warn("Convex URL not configured for email sending");
    // Return a mock client that logs warnings
    return {
      action: async (action: any, args: any) => {
        console.warn("Email would be sent:", action, args);
      }
    };
  }
  return new ConvexHttpClient(convexUrl);
};

export const createAuth = (ctx: GenericCtx) =>
  betterAuth({
    baseURL: siteUrl,
    database: convexAdapter(ctx, betterAuthComponent),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true, // ✅ Now requires email verification
      minPasswordLength: 8,
      maxPasswordLength: 128,
      // Send password reset email
      sendResetPassword: async ({ user, url, token }, request) => {
        // Call Convex action via HTTP client to send email
        const convexClient = getConvexClient();
        await convexClient.action(api.emailActions.sendPasswordResetEmail, {
          email: user.email,
          name: user.name,
          resetUrl: url,
        });
      },
      // Callback after password reset
      onPasswordReset: async ({ user }, request) => {
        console.log(`Password reset successfully for user: ${user.email}`);
        // You can add additional logic here like logging to a security audit table
      },
      resetPasswordTokenExpiresIn: 3600, // 1 hour
    },
    // Email verification configuration
    emailVerification: {
      // Send verification email function
      sendVerificationEmail: async ({ user, url, token }, request) => {
        // Call Convex action via HTTP client to send email
        const convexClient = getConvexClient();
        await convexClient.action(api.emailActions.sendVerificationEmail, {
          email: user.email,
          name: user.name,
          verificationUrl: url,
        });
      },
      // Automatically send verification email on signup
      sendOnSignUp: true,
      // Also send on sign-in if not verified
      sendOnSignIn: true,
      // Auto sign-in after verification
      autoSignInAfterVerification: true,
      // Token expiration (1 hour)
      expiresIn: 3600,
      // Callback after successful verification
      async afterEmailVerification(user, request) {
        console.log(`Email verified for user: ${user.email}`);
        // Send welcome email after verification
        const convexClient = getConvexClient();
        await convexClient.action(api.emailActions.sendWelcomeEmail, {
          email: user.email,
          name: user.name,
        });
        // You can add additional logic here like:
        // - Granting access to premium features
        // - Logging the verification event
        // - Updating user status in your database
      },
    },
    secret: process.env.BETTER_AUTH_SECRET!,
    plugins: [
      // The Convex plugin is required
      convex(),
    ],
  });
