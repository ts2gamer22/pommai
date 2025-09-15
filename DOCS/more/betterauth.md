User Signs Up
     ↓
BetterAuth creates record in _users table
     ↓
onCreateUser callback triggered
     ↓
Our app creates record in users table
     ↓
Both tables stay in sync via callbacks
     ↓
App functions use getAuthUserId() to get our users table ID
     ↓
All app relationships use our users table IDs

How BetterAuth Schema and Manual User Schema Work Together
Here's the complete explanation of how our authentication system now works:

Dual Table Architecture
BetterAuth _users Table (Managed Automatically)

Contains: id, email, name, image, emailVerified, createdAt, updatedAt
Handles: Authentication, sessions, password hashing, OAuth
Managed by: BetterAuth component automatically
Manual users Table (Our Application Table)

Contains: email, emailVerified, name, image, createdAt, updatedAt
Purpose: App-specific user data and relationships
Managed by: Our application code

How They Sync
// In auth.ts - The Bridge Between Tables
export const {
  createUser,
  updateUser,
  deleteUser,
  createSession,
  isAuthenticated,
} = betterAuthComponent.createAuthFunctions<DataModel>({
  // When BetterAuth creates a user, we create our app user
  onCreateUser: async (ctx, user) => {
    return ctx.db.insert("users", {
      email: user.email,
      emailVerified: user.emailVerified || false,
      name: user.name || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  },

  // When BetterAuth updates a user, we sync our app user
  onUpdateUser: async (ctx, user) => {
    await ctx.db.patch(user.userId as Id<"users">, {
      email: user.email,
      emailVerified: user.emailVerified || false,
      name: user.name || "",
      updatedAt: new Date().toISOString(),
    });
  },

  // When BetterAuth deletes a user, we delete our app user
  onDeleteUser: async (ctx, userId) => {
    await ctx.db.delete(userId as Id<"users">);
  },
});

How Authentication Works in Functions
// In any Convex function
export const createToy = mutation({
  handler: async (ctx, args) => {
    // Step 1: Check if user is authenticated
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Step 2: Get the user ID from our app's users table
    const userId = await betterAuthComponent.getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    // Step 3: Use userId for all app operations
    const toyId = await ctx.db.insert("toys", {
      creatorId: userId as any, // Cast needed for type compatibility
      // ... other fields
    });
  },
});


Key Benefits
Single Source of Truth: BetterAuth handles all auth complexity
App Flexibility: Our users table can have any app-specific fields
Transactional Sync: User creation/updates happen atomically
Type Safety: Full TypeScript support for our schema
Scalability: Can add app-specific user data without touching auth