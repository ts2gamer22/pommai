GITHUB: https://github.com/get-convex/better-auth

GUIDE:
Convex
+
Better Auth
Comprehensive, secure authentication with Better Auth for Convex.

Get Started
GitHub
Alpha Status
The Convex Better Auth component is in early alpha development.

If your use case isn't supported, a plugin doesn't work, you hit a bug, etc, please open a GitHub issue or reach out on Discord.

🎉
v0.7.0 Released!
Highlights
All plugins supported!
A proper internal database adapter that works dynamically for generic plugin support
CORS handling improved and no longer on by default - no more cors errors for full stack apps 🙌
Internal schema now generated with Better Auth for improved stability
This comes with some breaking changes - check out the migration guide to upgrade.

Read the full announcement on Discord for detailed notes and future plans.

What is this?
This library is a Convex Component that provides an integration layer for using Better Auth with Convex.

After following the installation and setup steps below, you can use Better Auth in the normal way. Some exceptions will apply for certain configuration options, apis, and plugins.

Check out the Better Auth docs for usage information, plugins, and more.

Examples
Check out complete working examples on GitHub.

React

Next.js

TanStack Start

Getting Started
Prerequisites
You'll first need a project on Convex where npx convex dev has been run on your local machine. If you don't have one, run npm create convex@latest to get started, and check out the docs to learn more.

It's helpful to have the Convex dev server (npx convex dev) running in the background while setting up, otherwise you'll see type errors that won't resolve until you run it.

Installation
Install the component
To get started, install the component, a pinned version of Better Auth, and the latest version of Convex.

This component requires Convex 1.25.0 or later.

npm
pnpm
yarn
bun
Terminal
Copy code
npm install @convex-dev/better-auth
npm install better-auth@1.3.4 --save-exact
npm install convex@latest
Add the component to your application.

convex/convex.config.ts
Copy code
import { defineApp } from 'convex/server'
import betterAuth from '@convex-dev/better-auth/convex.config'

const app = defineApp()
app.use(betterAuth)

export default app
Add a convex/auth.config.ts file to configure Better Auth as an authentication provider:

convex/auth.config.ts
Copy code
export default {
  providers: [
    {
      // Your Convex site URL is provided in a system
      // environment variable
      domain: process.env.CONVEX_SITE_URL,

      // Application ID has to be "convex"
      applicationID: "convex",
    },
  ],
}
Set environment variables
Generate a secret for encryption and generating hashes. Use the command below if you have openssl installed, or use the button to generate a random value instead. Or generate your own however you like.

Terminal
Copy code
npx convex env set BETTER_AUTH_SECRET=$(openssl rand -base64 32)
Generate Secret
Add your site URL to your Convex deployment.

React
Next.js
TanStack Start
Terminal
Copy code
npx convex env set SITE_URL http://localhost:3000
Add the Convex site URL environment variable to the .env.local file created by npx convex dev. It will be picked up by your framework dev server.

React
Next.js
TanStack Start
.env.local
Copy code
# Deployment used by `npx convex dev`
CONVEX_DEPLOYMENT=dev:adjective-animal-123 # team: team-name, project: project-name

NEXT_PUBLIC_CONVEX_URL=https://adjective-animal-123.convex.cloud
# Or if you are using the local convex instance
# NEXT_PUBLIC_CONVEX_URL=http://127.0.0.1:3210

# Same as NEXT_PUBLIC_CONVEX_URL but ends in .site
NEXT_PUBLIC_CONVEX_SITE_URL=https://adjective-animal-123.convex.site
# Or if you are using the local convex instance
# NEXT_PUBLIC_CONVEX_SITE_URL=http://127.0.0.1:3211

SITE_URL=http://localhost:3000
Initialize Better Auth
The Better Auth component uses the Convex database adapter, which handles all things schema and migration related automatically.

First, add a users table to your schema. Name it whatever you like. Better Auth has its own user table that tracks basic user data, so your application user table only needs fields specific to your app (or none at all).

convex/schema.ts
Copy code
import { defineSchema, defineTable } from "convex/server";

export default defineSchema({
  users: defineTable({
    // Fields are optional
  }),
});
Create your Better Auth instance.

Note: Some Typescript errors will show until you save the file.

React
Next.js
TanStack Start
lib/auth.ts
Copy code
import { convexAdapter } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { requireEnv } from "@convex-dev/better-auth/utils";
import { betterAuth } from "better-auth";
import { betterAuthComponent } from "../convex/auth";
import { type GenericCtx } from "../convex/_generated/server";

const siteUrl = requireEnv("SITE_URL");

export const createAuth = (ctx: GenericCtx) =>
  // Configure your Better Auth instance here
  betterAuth({
    // All auth requests will be proxied through your next.js server
    baseURL: siteUrl,
    database: convexAdapter(ctx, betterAuthComponent),

    // Simple non-verified email/password to get started
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    plugins: [
      // The Convex plugin is required
      convex(),
    ],
  });
React
Next.js
TanStack Start
convex/auth.ts
Copy code
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
      return ctx.db.insert("users", {});
    },

    // Delete the user when they are deleted from Better Auth
    onDeleteUser: async (ctx, userId) => {
      await ctx.db.delete(userId as Id<"users">);
    },
  });

// Example function for getting the current user
// Feel free to edit, omit, etc.
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    // Get user data from Better Auth - email, name, image, etc.
    const userMetadata = await betterAuthComponent.getAuthUser(ctx);
    if (!userMetadata) {
      return null;
    }
    // Get user data from your application's database
    // (skip this if you have no fields in your users table schema)
    const user = await ctx.db.get(userMetadata.userId as Id<"users">);
    return {
      ...user,
      ...userMetadata,
    };
  },
});
Create a Better Auth client instance
Create a Better Auth client instance for interacting with the Better Auth server from your client.

React
Next.js
TanStack Start
lib/auth-client.ts
Copy code
import { createAuthClient } from "better-auth/react";
import { convexClient } from "@convex-dev/better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [
    convexClient(),
  ],
});
Mount handlers
Register Better Auth route handlers on your Convex deployment.

React
Next.js
TanStack Start
convex/http.ts
Copy code
import { httpRouter } from 'convex/server'
import { betterAuthComponent } from './auth'
import { createAuth } from '../lib/auth'

const http = httpRouter()

betterAuthComponent.registerRoutes(http, createAuth)

export default http
Set up route handlers to proxy auth requests from your framework server to your Convex deployment.

React
Next.js
TanStack Start
app/api/auth/[...all]/route.ts
Copy code
import { nextJsHandler } from "@convex-dev/better-auth/nextjs";

export const { GET, POST } = nextJsHandler();
Set up Convex client provider
Wrap your app with the ConvexBetterAuthProvider component.

React
Next.js
TanStack Start
app/ConvexClientProvider.tsx
Copy code
"use client";

import { ReactNode } from "react";
import { ConvexReactClient } from "convex/react";
import { authClient } from "@/lib/auth-client";
import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexBetterAuthProvider client={convex} authClient={authClient}>
      {children}
    </ConvexBetterAuthProvider>
  );
}
Basic Usage
Follow the Better Auth documentation for basic usage. The Convex component provides a compatibility layer so things generally work as expected.

Some things that do work differently with this component are documented here.

Signing in
Below is an extremely basic example of a working auth flow with email (unverified) and password.

React
Next.js
TanStack Router
app/page.tsx
Copy code
"use client";

import { useState } from "react";
import {
  Authenticated,
  Unauthenticated,
  AuthLoading,
  useQuery,
} from "convex/react";
import { authClient } from "@/lib/auth-client";
import { api } from "../convex/_generated/api";

export default function App() {
  return (
    <>
      <AuthLoading>
        <div>Loading...</div>
      </AuthLoading>
      <Unauthenticated>
        <SignIn />
      </Unauthenticated>
      <Authenticated>
        <Dashboard />
      </Authenticated>
    </>
  );
}

function Dashboard() {
  const user = useQuery(api.auth.getCurrentUser);
  return (
    <div>
      <div>Hello {user?.name}!</div>
      <button onClick={() => authClient.signOut()}>Sign out</button>
    </div>
  );
}

function SignIn() {
  const [showSignIn, setShowSignIn] = useState(true);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    if (showSignIn) {
      await authClient.signIn.email(
        {
          email: formData.get("email") as string,
          password: formData.get("password") as string,
        },
        {
          onError: (ctx) => {
            window.alert(ctx.error.message);
          },
        }
      );
    } else {
      await authClient.signUp.email(
        {
          name: formData.get("name") as string,
          email: formData.get("email") as string,
          password: formData.get("password") as string,
        },
        {
          onError: (ctx) => {
            window.alert(ctx.error.message);
          },
        }
      );
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        {!showSignIn && <input name="name" placeholder="Name" />}
        <input type="email" name="email" placeholder="Email" />
        <input type="password" name="password" placeholder="Password" />
        <button type="submit">{showSignIn ? "Sign in" : "Sign up"}</button>
      </form>
      <p>
        {showSignIn ? "Don't have an account? " : "Already have an account? "}
        <button onClick={() => setShowSignIn(!showSignIn)}>
          {showSignIn ? "Sign up" : "Sign in"}
        </button>
      </p>
    </>
  );
}
Authorization
React
To check authentication state in your React components, use the authentication state components from convex/react.

App.tsx
Copy code
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";

export default function App() {
  return (
    <>
      <AuthLoading>
        <div>Loading...</div>
      </AuthLoading>
      <Authenticated>
        <Dashboard />
      </Authenticated>
      <Unauthenticated>
        <SignIn />
      </Unauthenticated>
    </>
  )
}
Convex Functions
For authorization and user checks inside Convex functions (queries, mutations, actions), use Convex's ctx.auth or thegetAuthUserId()/getAuthUser() methods on the Better Auth Convex component:

convex/someFile.ts
Copy code
import { betterAuthComponent } from "./auth";
import { Id } from "./_generated/dataModel";

export const myFunction = query({
  args: {},
  handler: async (ctx) => {
    // You can get the user id directly from Convex via ctx.auth
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }
    // For now the id type requires an assertion
    const userIdFromCtx = identity.subject as Id<"users">;

    // The component provides a convenience method to get the user id
    const userId = await betterAuthComponent.getAuthUserId(ctx);
    if (!userId) {
      return null
    }

    const user = await ctx.db.get(userId as Id<"users">);


    // Get user email and other metadata from the Better Auth component
    const userMetadata = await betterAuthComponent.getAuthUser(ctx);

    // You can combine them if you want
    return { ...userMetadata, ...user };
  }
});
Framework server
Framework server-side authentication with the Better Auth component works similar to other Convex authentication providers. See the Convex docs for your framework for more details.

Next.js
TanStack Start
Framework server side authentication with Convex requires a token. To get an identity token with Better Auth, use the framework appropriate getToken approach.

Next.js
TanStack Router
app/actions.ts
Copy code
"use server";

import { api } from "@/convex/_generated/api";
import { getToken } from "@convex-dev/better-auth/nextjs";
import { fetchMutation } from "convex/nextjs";
import { createAuth } from "../lib/auth";

// Authenticated mutation via server function
export async function createPost(title: string, content: string) {
  const token = await getToken(createAuth);
  await fetchMutation(api.posts.create, { title, content }, { token });
}
Server side
Using auth.api
For full stack frameworks like Next.js and TanStack Start, Better Auth provides server side functionality via auth.api methods. With Convex, you would instead run these methods in your Convex functions.

Some auth.api methods require request headers. The Convex component provides a method for generating headers for the current session.

auth.api read-only methods can be run in a query. Use a mutation for anything that updates Better Auth tables.

convex/someFile.ts
Copy code
import { betterAuthComponent } from "./auth";
import { createAuth } from "../src/lib/auth";

// Example: using the getSession method in a Convex query

export const getSession = query({
  args: {},
  handler: async (ctx) => {
    const auth = createAuth(ctx);

    // Get an access token for a user by id
    const accessToken = await auth.api.getAccessToken({
      body: {
        providerId: "github",
        userId: "some-user-id",
      },
    });

    // For auth.api methods that require a session (such as
    // getSession()), you can use the getHeaders method to
    // get a headers object
    const headers = await betterAuthComponent.getHeaders(ctx);
    const session = await auth.api.getSession({
      headers,
    });
    if (!session) {
      return null;
    }
    // Do something with the session
    return session;
  }
});
That's it!
That's it! You should now have a working authentication system.

Check out the Better Auth docs for more information on how to use Better Auth.

Integrations
Hono
Hono can be used in place of the component registerRoutes() method. Check out the Convex w/ Hono Stack article and the Better Auth Hono docs for more details.

You'll need to install the convex-helpers package if you haven't already.

React
Next.js
TanStack Start
convex/http.ts
Copy code
import { Hono } from "hono";
import { HonoWithConvex, HttpRouterWithHono } from "convex-helpers/server/hono";
import { cors } from "hono/cors";
import { ActionCtx } from "./_generated/server";
import { createAuth } from "../lib/auth";

const app: HonoWithConvex<ActionCtx> = new Hono();

app.use(
  "/api/auth/*",
  cors({
    origin: "http://localhost:5173",
    allowHeaders: ["Content-Type", "Authorization", "Better-Auth-Cookie"],
    allowMethods: ["GET", "POST", "OPTIONS"],
    exposeHeaders: ["Content-Length", "Set-Better-Auth-Cookie"],
    maxAge: 600,
    credentials: true,
  })
);

// Redirect root well-known to api well-known
app.get("/.well-known/openid-configuration", async (c) => {
  return c.redirect('/api/auth/convex/.well-known/openid-configuration')
});

app.on(["POST", "GET"], "/api/auth/*", async (c) => {
  const auth = createAuth(c.env);
  return auth.handler(c.req.raw);
});

const http = new HttpRouterWithHono(app);

export default http;
Guides
Users table
The Better Auth component has it's own tables in it's own space in your Convex project, like all Convex components. This means the Better Auth user table is separate from your application tables.

Because of this, the Better Auth component requires that you create your own users table for your application. This table can have whatever fields you like, while the component user table keeps basic info such as email, verification status, two factor, etc.

User creation
When Better Auth creates a user, it will first run anonCreateUser hook where you will create your user and return the id. Better Auth then creates it's own user record and sets a relation to the provided id.

The id you return will be the canonical user id. It will be referenced in the session and in the jwt claims provided to Convex.

onCreateUser is required for keeping your users table transactionally synced with the Better Auth user table. There are also optional onUpdateUser and onDeleteUser hooks. These hooks can also do whatever else you want for each event.

onUpdateUser and onDeleteUser run when Better Auth updates a user, but any updates to your own app's users table will not trigger it. If you are syncing fields from Better Auth (eg., email) to your own users table, it is recommended to make changes to those fields through Better Auth so things stay synced.

convex/auth.ts
Copy code
import { asyncMap } from "convex-helpers";
import { betterAuthComponent } from "./auth";
import { Id } from "./_generated/dataModel";

export const { createUser, deleteUser, updateUser, createSession } =
  betterAuthComponent.createAuthFunctions({

    // Must create a user and return the user id
    onCreateUser: async (ctx, user) => {
      const userId = await ctx.db.insert("users", {
        someField: "foo",
      });

      // The user id must be returned
      return userId;
    },

    onUpdateUser: async (ctx, user) => {
      await ctx.db.patch(user.userId as Id<"users">, {
        someField: "foo",
      });
    },

    // Delete the user when they are deleted from Better Auth
    // You can also omit this and use Better Auth's
    // auth.api.deleteUser() function to trigger user deletion
    // from within your own user deletion logic.
    onDeleteUser: async (ctx, userId) => {
      await ctx.db.delete(userId as Id<"users">);

      // Optionally delete any related data
    },
  });
Indexing on metadata
You may have a need for accessing user metadata in your own user table, such as indexing by email or some other metadata. You can copy user metadata to your own user table on creation, and use the optional onUpdateUser hook to update your user table when a user's metadata changes. Note that changes you make to the synced field will not be reflected in the Better Auth user table.

The user hooks are run in the same transaction as Better Auth's user create/update/delete operations, so if your hook throws an error or fails to write, the entire operation is guaranteed to fail, ensuring the user tables stay synced.

convex/auth.ts
Copy code
// ...

export const { createUser, deleteUser, updateUser } =
  betterAuthComponent.createAuthFunctions({
    onCreateUser: async (ctx, user) => {
      // Copy the user's email to the application users table.
      return await ctx.db.insert("users", {
        email: user.email,
      });
    },

    onUpdateUser: async (ctx, user) => {
      // Keep the user's email synced
      await ctx.db.patch(user.userId as Id<"users">, {
        email: user.email,
      });
    },

    // ...
  });
Migrating Existing Users
Note: This guide is for applications migrating users that are already in their Convex database, and does not cover email/password authentication due to differences in password hashing.

If you're migrating from an existing authentication system, you can use a gradual migration approach that moves users over as they log in. This method is less disruptive than a bulk migration and allows you to handle edge cases more gracefully.

Implement the migration logic in your onCreateUser hook in convex/auth.ts. This will run when Better Auth attempts to create a new user, allowing you to gradually migrate users as they access your app.

convex/auth.ts
Copy code
export const { createUser, deleteUser, updateUser, createSession } =
  betterAuthComponent.createAuthFunctions({
    onCreateUser: async (ctx, user) => {
      const existingUser = await ctx.db
        .query('users')
        .withIndex('email', (q) => q.eq('email', user.email))
        .unique()

      if (existingUser && !user.emailVerified) {
        // This would be due to a social login provider where the email is not
        // verified.
        throw new ConvexError('Email not verified')
      }

      if (existingUser) {
        // Drop old auth system fields (if any)
        await ctx.db.patch(existingUser._id as Id<'users'>, {
          oldAuthField: undefined,
          otherOldAuthField: undefined,
          foo: 'bar',
        })
        return existingUser._id as Id<'users'>
      }

      // No existing user found, create a new one and return the id
      return await ctx.db.insert('users', {
        foo: 'bar',
      })
    },
    // ...
  })
Migrate 0.6 → 0.7
Update Better Auth
Update the component to latest, the better-auth package to 1.3.4, and Convex to latest (or at least 1.25.0).

npm
pnpm
yarn
bun
Terminal
Copy code
npm install @convex-dev/better-auth@latest
npm install better-auth@1.3.4 --save-exact
npm install convex@latest
registerRoutes()
The betterAuthComponent.registerRoutes() method no longer includes CORS route handling by default. This is the correct behavior for full stack apps using the Next.js or TanStack instructions, as well as Expo native apps.
For React or any app that is only using client side auth (if your app uses the crossDomain plugin, this applies), you will need to pass the cors: true option.
The path and allowedOrigins options have been removed, and now defer entirely to Better Auth's basePath and trustedOrigins options, respectively.
convex/http.ts
Copy code
import { httpRouter } from 'convex/server'
import { betterAuthComponent } from './auth'
import { createAuth } from '../src/lib/auth'

const http = httpRouter()

betterAuthComponent.registerRoutes(http, createAuth, {
  // Remove these if you were using them
  path: "/api/auth",
  allowedOrigins: ["http://localhost:3000"],

  // Only add this for client-only apps
  cors: true,
})

export default http
Relocate createAuth()
Relocate createAuth() from convex/auth.tsto <lib>/auth.ts - this will avoid warnings from Convex 1.25+ about importing Convex functions into the browser.

Be sure to update all imports of createAuth to the new location.

React
Next.js
TanStack Start
lib/auth.ts
Copy code
import { convexAdapter } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { betterAuth } from "better-auth";
import { betterAuthComponent } from "../convex/auth";
import { type GenericCtx } from "../convex/_generated/server";

// You'll want to replace this with an environment variable
const siteUrl = "http://localhost:3000";

export const createAuth = (ctx: GenericCtx) =>
  // Configure your Better Auth instance here
  betterAuth({
    // All auth requests will be proxied through your next.js server
    baseURL: siteUrl,
    database: convexAdapter(ctx, betterAuthComponent),

    // Simple non-verified email/password to get started
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    plugins: [
      // The Convex plugin is required
      convex(),
    ],
  });
React
Next.js
TanStack Start
convex/auth.ts
Copy code
import {
  BetterAuth,
  convexAdapter,
  type AuthFunctions,
  type PublicAuthFunctions,
} from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { betterAuth } from "better-auth";
import { api, components, internal } from "./_generated/api";
import { query, type GenericCtx } from "./_generated/server";
import { query } from "./_generated/server";
import type { Id, DataModel } from "./_generated/dataModel";

// ... existing code ...

export const createAuth = (ctx: GenericCtx) =>
  // Configure your Better Auth instance here
  betterAuth({
    // All auth requests will be proxied through your next.js server
    baseURL: "http://localhost:3000",
    database: convexAdapter(ctx, betterAuthComponent),

    // Simple non-verified email/password to get started
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    plugins: [
      // The Convex plugin is required
      convex(),
    ],
  });

// ... existing code ...
TanStack auth helpers
Because environment variables are not accessible to dependencies with Vite, the react-start exports should now be initialized together in a single file. You can do this anywhere, src/lib/server-auth-utils.ts is just a recommendation.

src/lib/server-auth-utils.ts
Copy code
import { reactStartHelpers } from '@convex-dev/better-auth/react-start'
import { createAuth } from '../src/lib/auth'

export const { fetchSession, reactStartHandler, getCookieName } =
  reactStartHelpers(createAuth, {
    convexSiteUrl: import.meta.env.VITE_CONVEX_SITE_URL,
  })
Update imports and getCookieName() args in the root layout.

src/routes/__root.tsx
Copy code
import { authClient } from '@/lib/auth-client'
import { createAuth } from '@/lib/auth'
import { fetchSession, getCookieName } from '@convex-dev/better-auth/react-start'
import { fetchSession, getCookieName } from '@/lib/server-auth-utils'

// ...

// Server side session request
const fetchAuth = createServerFn({ method: 'GET' }).handler(async () => {
  const sessionCookieName = await getCookieName(createAuth)
  const sessionCookieName = await getCookieName()
  const token = getCookie(sessionCookieName)
  const request = getWebRequest()
  const { session } = await fetchSession(request)
  return {
    userId: session?.user.id,
    token,
  }
})
Update imports in the auth handler route.

src/routes/api/auth/$.ts
Copy code
import { createServerFileRoute } from '@tanstack/react-start/server'
import { reactStartHandler } from '@convex-dev/better-auth/react-start'
import { reactStartHandler } from '@/lib/server-auth-utils'
Migrate 0.5 → 0.6
All imports from @erquhart/convex-better-auth have been updated to @convex-dev/better-auth. Search and replace this across your repo.
Your framework may work full stack without cross domain - go checkout the installation section for more details.
AuthFunctions are now passed to the BetterAuth component constructor via the config object.
The crossDomain plugin now requires a siteUrl option.
convex/auth.ts
Copy code
import { BetterAuth, type AuthFunctions, convexAdapter } from "@erquhart/convex-better-auth";
import { convex, crossDomain } from "@erquhart/convex-better-auth/plugins";
import { BetterAuth, type AuthFunctions, convexAdapter } from "@convex-dev/better-auth";
import { convex, crossDomain } from "@convex-dev/better-auth/plugins";

export const betterAuthComponent = new BetterAuth(
  components.betterAuth,
  authFunctions,
  {
    authFunctions: authFunctions,
  }
)
export const createAuth = (ctx: GenericCtx) =>
  betterAuth({
    trustedOrigins: ["http://localhost:3000"],
    database: convexAdapter(ctx, betterAuthComponent),
    plugins: [
      convex(),
      crossDomain(),
      crossDomain({
        siteUrl: "http://localhost:3000",
      }),
    ],
  });
Migrate 0.4 → 0.5
Plugins and client plugins exported by the Convex Better Auth component are now exported under /plugins and/client/plugins respectively.
A new crossDomain plugin is available. It's functionality was previously baked into the convex plugin.
Projects that were running v0.4.x will need to add the crossDomain plugin to their Better Auth client and server instances.
convex/auth.ts
Copy code
import { convex, crossDomain } from "@erquhart/convex-better-auth/plugins";
import { betterAuth } from "better-auth";
import { GenericCtx } from "./_generated/server";

export const createAuth = (ctx: GenericCtx) =>
  betterAuth({
    // ...
    plugins: [crossDomain(), convex()],
  });
lib/auth-client.ts
Copy code
import { createAuthClient } from "better-auth/react";
import {
  convexClient,
  crossDomainClient,
} from "@erquhart/convex-better-auth/client/plugins";

export const authClient = createAuthClient({
  // ...
  plugins: [crossDomainClient(), convexClient()],
});
The betterAuthComponent.authApi method is now betterAuthComponent.createAuthFunctions.
All four named exports returned from betterAuthComponent.createAuthFunctions are now required, even if you're only providing an onCreateUser hook.
If you pass your DataModel to betterAuthComponent.createAuthFunctions, everything is now typed except for Ids, which still need to be asserted. Any other type assertions from before can be removed.
convex/users.ts
Copy code
import { betterAuthComponent } from "./auth";
import type { DataModel } from "./_generated/dataModel";

export const { createUser, deleteUser, updateUser, createSession } =
  betterAuthComponent.createAuthFunctions<DataModel>({
    onCreateUser: async (ctx, user) => {
      return await ctx.db.insert('users', {})
    },
  })
The authFunctions object (formerly authApi) is now passed to the BetterAuth constructor, and is no longer passed to convexAdapter.
authFunctions is now typed using the AuthFunctions type.
convexAdapter now takes the betterAuthComponent instance instead of the components.betterAuth object.
convex/auth.ts
Copy code
import { BetterAuth, type AuthFunctions } from "@erquhart/convex-better-auth";
import { convex, crossDomain } from "@erquhart/convex-better-auth/plugins";
import { components, internal } from "./_generated/api";

const authFunctions: AuthFunctions = internal.users;

export const betterAuthComponent = new BetterAuth(
  components.betterAuth,
  authFunctions,
);

export const createAuth = (ctx: GenericCtx) =>
  betterAuth({
    database: convexAdapter(ctx, betterAuthComponent),
    trustedOrigins: ["http://localhost:3000"],
    plugins: [convex(), crossDomain()],
  });
Debugging
Verbose logs from the Better Auth component can be enabled on the component constructor.

convex/auth.ts
Copy code
export const betterAuthComponent = new BetterAuth(
  components.betterAuth,
  {
    // ...
    verbose: true,
  }
);
Verbose logs in the client can be enabled on the Convex client constructor.

src/main.ts
Copy code
const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string, {
  verbose: true,
});

IF YOU NEED EXAMPLE: https://github.com/get-convex/better-auth/tree/latest/examples/next

## WHENEVER YOU NEED HELP WITH MORE CONTEXT, STOP CODING AND ASK THE USER! 