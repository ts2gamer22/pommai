import {
  BetterAuth,
  type AuthFunctions,
  type PublicAuthFunctions,
} from "@convex-dev/better-auth";
import { api, components, internal } from "./_generated/api";
import { query } from "./_generated/server";
import type { Id, DataModel } from "./_generated/dataModel";

// Typesafe way to pass Convex functions defined in this file
const authFunctions: AuthFunctions = internal.auth;
const publicAuthFunctions: PublicAuthFunctions = api.auth;

// Initialize the component
export const betterAuthComponent = new BetterAuth(
  components.betterAuth,
  {
    authFunctions,
    publicAuthFunctions,
  }
);

// These are required named exports
export const {
  createUser,
  updateUser,
  deleteUser,
  createSession,
  isAuthenticated,
} =
  betterAuthComponent.createAuthFunctions<DataModel>({
    // Must create a user and return the user id
    onCreateUser: async (ctx, user) => {
      return ctx.db.insert("users", {
        email: user.email,
        emailVerified: user.emailVerified || false, // ✅ Use actual verification status from Better Auth
        name: user.name || "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    },

    // Update the user when they are updated in Better Auth
    onUpdateUser: async (ctx, user) => {
      await ctx.db.patch(user.userId as Id<"users">, {
        email: user.email,
        emailVerified: user.emailVerified || false, // ✅ Sync verification status
        name: user.name || "",
        updatedAt: new Date().toISOString(),
      });
    },

    // Delete the user when they are deleted from Better Auth
    onDeleteUser: async (ctx, userId) => {
      await ctx.db.delete(userId as Id<"users">);
    },
  });

// Example function for getting the current user
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    // Get user data from Better Auth - email, name, image, etc.
    const userMetadata = await betterAuthComponent.getAuthUser(ctx);
    if (!userMetadata) {
      return null;
    }
    // Get user data from your application's database
    const user = await ctx.db.get(userMetadata.userId as Id<"users">);
    return {
      ...user,
      ...userMetadata,
    };
  },
});
