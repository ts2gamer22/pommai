import { convexAdapter } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { requireEnv } from "@convex-dev/better-auth/utils";
import { betterAuth } from "better-auth";
import { betterAuthComponent } from "../../convex/auth";
import { type GenericCtx } from "../../convex/_generated/server";

const siteUrl = requireEnv("SITE_URL");

export const createAuth = (ctx: GenericCtx) =>
  betterAuth({
    baseURL: siteUrl,
    database: convexAdapter(ctx, betterAuthComponent),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    secret: process.env.BETTER_AUTH_SECRET!,
    plugins: [
      // The Convex plugin is required
      convex(),
    ],
  });
