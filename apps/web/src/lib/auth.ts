import { convexAdapter } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { requireEnv } from "@convex-dev/better-auth/utils";
import { betterAuth } from "better-auth";
import { betterAuthComponent } from "../../convex/auth";
import { type GenericCtx } from "../../convex/_generated/server";
import { api } from "../../convex/_generated/api";
const siteUrl = requireEnv("SITE_URL");

export const createAuth = (ctx: GenericCtx) => {
  const requireVerificationEnv = process.env.AUTH_REQUIRE_EMAIL_VERIFICATION;
  const REQUIRE_EMAIL_VERIFICATION = typeof requireVerificationEnv === 'string'
    ? requireVerificationEnv.toLowerCase() === 'true'
    : process.env.NODE_ENV === 'production';

  return betterAuth({
    baseURL: siteUrl,
    database: convexAdapter(ctx, betterAuthComponent),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: REQUIRE_EMAIL_VERIFICATION,
      minPasswordLength: 8,
      maxPasswordLength: 128,
      // Send password reset email
      sendResetPassword: async ({ user, url, token }, request) => {
        if (!REQUIRE_EMAIL_VERIFICATION) {
          // Dev mode: log the reset URL to console instead of sending
          console.warn('[DEV] Password reset URL:', url);
          return;
        }
        await (ctx as any).runAction(api.emailActions.sendPasswordResetEmail, {
          email: user.email,
          name: user.name,
          resetUrl: url,
        });
      },
      // Callback after password reset
      onPasswordReset: async ({ user }, request) => {
        console.log(`Password reset successfully for user: ${user.email}`);
      },
      resetPasswordTokenExpiresIn: 3600, // 1 hour
    },
    // Email verification configuration
    emailVerification: {
      // Send verification email function
      sendVerificationEmail: async ({ user, url, token }, request) => {
        if (!REQUIRE_EMAIL_VERIFICATION) {
          // Dev mode: log the verification URL to console instead of sending
          console.warn('[DEV] Email verification URL:', url);
          return;
        }
        await (ctx as any).runAction(api.emailActions.sendVerificationEmail, {
          email: user.email,
          name: user.name,
          verificationUrl: url,
        });
      },
      // Automatically send verification email on signup/signin only if required
      sendOnSignUp: REQUIRE_EMAIL_VERIFICATION,
      sendOnSignIn: REQUIRE_EMAIL_VERIFICATION,
      // Auto sign-in after verification
      autoSignInAfterVerification: true,
      // Token expiration (1 hour)
      expiresIn: 3600,
      // Callback after successful verification
      async afterEmailVerification(user, request) {
        console.log(`Email verified for user: ${user.email}`);
        if (!REQUIRE_EMAIL_VERIFICATION) return;
        await (ctx as any).runAction(api.emailActions.sendWelcomeEmail, {
          email: user.email,
          name: user.name,
        });
      },
    },
    secret: process.env.BETTER_AUTH_SECRET!,
    plugins: [
      // The Convex plugin is required
      convex(),
    ],
  });
};
