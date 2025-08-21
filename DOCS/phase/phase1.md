# Phase 1: Foundation Setup (Week 1-2)
> Detailed implementation guide for Pommai.co platform foundation

## Overview
Phase 1 focuses on establishing the core infrastructure for the Pommai.co platform. This includes setting up the monorepo, initializing the web application with Next.js 15 and Convex, implementing authentication with BetterAuth, and creating the foundational UI components using RetroUI.

## Prerequisites
- Node.js 20+ installed
- Git configured
- Vercel account for deployment
- Convex account for backend
- **Context7mcp**: Will need access to BetterAuth documentation and examples

## Task 1: Setup Monorepo with Turborepo
**Time Estimate**: 2-3 hours
**Dependencies**: None

### Objectives
- Create a scalable monorepo structure using Turborepo
- Configure workspaces for web app, packages, and future Raspberry Pi client
- Set up shared TypeScript and ESLint configurations

### Detailed Steps

1. **Initialize Turborepo Project**
   ```bash
   npx create-turbo@latest pommai-platform
   ```
   - Choose "pnpm" as package manager (better for monorepos)
   - Select "TypeScript" template
   - Include Tailwind CSS configuration

2. **Restructure for Our Needs**
   ```
   pommai-platform/
   ├── apps/
   │   ├── web/                 # Main Next.js application
   │   └── raspberry-pi/        # Future Python client (placeholder)
   ├── packages/
   │   ├── ui/                  # Shared UI components (RetroUI)
   │   ├── types/               # Shared TypeScript types
   │   ├── utils/               # Shared utilities
   │   └── config/              # Shared configurations
   ├── turbo.json               # Turborepo configuration
   ├── package.json             # Root package.json
   └── pnpm-workspace.yaml      # PNPM workspace config
   ```

3. **Configure Turbo.json**
   ```json
   {
     "$schema": "https://turbo.build/schema.json",
     "globalDependencies": ["**/.env.*local"],
     "pipeline": {
       "build": {
         "dependsOn": ["^build"],
         "outputs": [".next/**", "!.next/cache/**", "dist/**"]
       },
       "dev": {
         "cache": false,
         "persistent": true
       },
       "lint": {
         "dependsOn": ["^lint"]
       },
       "type-check": {
         "dependsOn": ["^type-check"]
       }
     }
   }
   ```

4. **Set up Shared TypeScript Config**
   Create `packages/config/typescript/base.json`:
   ```json
   {
     "compilerOptions": {
       "target": "ES2022",
       "lib": ["ES2022", "DOM", "DOM.Iterable"],
       "module": "ESNext",
       "moduleResolution": "bundler",
       "strict": true,
       "esModuleInterop": true,
       "skipLibCheck": true,
       "forceConsistentCasingInFileNames": true,
       "resolveJsonModule": true,
       "isolatedModules": true,
       "incremental": true
     }
   }
   ```

5. **Configure ESLint for Monorepo**
   - Set up shared ESLint config in `packages/config/eslint`
   - Include Next.js, TypeScript, and accessibility rules
   - **Context7mcp**: Need ESLint configuration best practices for Next.js 15

### Success Criteria
- [ ] Turborepo initialized with proper structure
- [ ] All packages properly linked in workspaces
- [ ] Build pipeline works across packages
- [ ] Shared configs accessible from all apps

## Task 2: Initialize Next.js 15 + Convex Project
**Time Estimate**: 3-4 hours
**Dependencies**: Task 1 completed

### Objectives
- Set up Next.js 15 with App Router in the web directory
- Integrate Convex for real-time database and backend functions
- Configure environment variables and project settings

### Detailed Steps

1. **Create Next.js 15 Application**
   ```bash
   cd apps/web
   npx create-next-app@latest . --typescript --tailwind --app --src-dir --import-alias "@/*"
   ```

2. **Install and Configure Convex**
   ```bash
   pnpm add convex
   pnpm dlx convex dev
   ```
   - **Context7mcp**: Need latest Convex setup guide for Next.js 15 App Router
   - This will create `convex/` directory and configuration files

3. **Set up Convex Schema Structure**
   Create `apps/web/convex/schema.ts`:
   ```typescript
   import { defineSchema, defineTable } from "convex/server";
   import { v } from "convex/values";

   export default defineSchema({
     // Parent/User accounts
     users: defineTable({
       email: v.string(),
       name: v.string(),
       role: v.union(v.literal("parent"), v.literal("admin")),
       createdAt: v.number(),
       // BetterAuth fields will be added
     }).index("by_email", ["email"]),

     // Toy configurations
     toys: defineTable({
       userId: v.id("users"),
       name: v.string(),
       personality: v.string(),
       voiceId: v.string(),
       avatar: v.optional(v.string()),
       knowledgeBase: v.optional(v.string()),
       safetySettings: v.object({
         ageGroup: v.union(v.literal("3-5"), v.literal("6-8"), v.literal("9-12")),
         contentFilters: v.array(v.string()),
         maxConversationLength: v.number(),
       }),
       deviceId: v.optional(v.string()), // Raspberry Pi device ID
       isActive: v.boolean(),
       createdAt: v.number(),
     }).index("by_user", ["userId"]),

     // Conversation logs
     conversations: defineTable({
       toyId: v.id("toys"),
       transcript: v.string(),
       audioUrl: v.optional(v.string()), // Temporary, deleted after 24-48h
       timestamp: v.number(),
       duration: v.number(),
       safetyFlags: v.optional(v.array(v.string())),
       sentiment: v.optional(v.string()),
     }).index("by_toy", ["toyId"])
       .index("by_timestamp", ["timestamp"]),

     // Safety incidents
     safetyIncidents: defineTable({
       conversationId: v.id("conversations"),
       toyId: v.id("toys"),
       severity: v.number(), // 1-7 based on Azure Content Safety
       category: v.string(),
       blockedContent: v.string(),
       timestamp: v.number(),
       parentNotified: v.boolean(),
     }).index("by_toy", ["toyId"])
       .index("by_severity", ["severity"]),
   });
   ```

4. **Configure Convex Client Provider**
   Create `apps/web/src/app/providers.tsx`:
   ```typescript
   "use client";
   
   import { ConvexProvider, ConvexReactClient } from "convex/react";
   import { ReactNode } from "react";

   const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

   export function Providers({ children }: { children: ReactNode }) {
     return (
       <ConvexProvider client={convex}>
         {children}
       </ConvexProvider>
     );
   }
   ```

5. **Update Root Layout**
   Modify `apps/web/src/app/layout.tsx` to include providers

6. **Environment Configuration**
   Create `.env.local`:
   ```
   NEXT_PUBLIC_CONVEX_URL=
   # Will add more after Convex deployment
   ```

### Success Criteria
- [ ] Next.js 15 app running with App Router
- [ ] Convex connected and schema deployed
- [ ] Environment variables properly configured
- [ ] Basic project structure established

## Task 3: Deploy to Vercel (Zero-Config)
**Time Estimate**: 1-2 hours
**Dependencies**: Task 2 completed

### Objectives
- Deploy the initial application to Vercel
- Set up automatic deployments from GitHub
- Configure production environment variables

### Detailed Steps

1. **Initialize Git Repository**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Pommai platform foundation"
   ```

2. **Create GitHub Repository**
   - Create new repo: `pommai-platform`
   - Push code to GitHub

3. **Connect to Vercel**
   ```bash
   pnpm dlx vercel
   ```
   - Select "apps/web" as root directory
   - Configure build settings for monorepo
   - **Context7mcp**: Need Vercel monorepo deployment best practices

4. **Configure Vercel for Monorepo**
   Create `apps/web/vercel.json`:
   ```json
   {
     "buildCommand": "cd ../.. && pnpm turbo run build --filter=web",
     "installCommand": "pnpm install",
     "framework": "nextjs",
     "outputDirectory": ".next"
   }
   ```

5. **Set Production Environment Variables**
   - Add Convex production URL
   - Configure any API keys needed
   - Set up preview deployments

6. **Configure Domain (Optional)**
   - Add custom domain if available
   - Set up SSL certificates (automatic with Vercel)

### Success Criteria
- [ ] Application deployed and accessible on Vercel
- [ ] Automatic deployments working from GitHub
- [ ] Environment variables properly set
- [ ] Preview deployments functional

## Task 4: Implement BetterAuth Authentication
**Time Estimate**: 4-5 hours
**Dependencies**: Tasks 1-3 completed
**Context7mcp**: Need BetterAuth documentation, GitHub repo, and Convex integration examples

### Objectives
- Integrate BetterAuth with Convex backend
- Set up parent registration and login flows
- Implement session management and protected routes
- Add social login options (Google, optional)

### Detailed Steps

1. **Install BetterAuth Dependencies**
   ```bash
   pnpm add better-auth @better-auth/react
   ```
   - **Context7mcp**: Need exact package names and versions for BetterAuth

2. **Configure BetterAuth with Convex**
   Create `apps/web/src/lib/auth.ts`:
   ```typescript
   // This is a placeholder - need actual BetterAuth configuration
   // Context7mcp: Need BetterAuth + Convex integration code
   import { BetterAuth } from "better-auth";
   import { ConvexAdapter } from "@better-auth/adapter-convex";

   export const auth = new BetterAuth({
     database: new ConvexAdapter({
       // Convex configuration
     }),
     emailAndPassword: {
       enabled: true,
       requireEmailVerification: true,
     },
     oauth: {
       google: {
         clientId: process.env.GOOGLE_CLIENT_ID!,
         clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
       },
     },
     // Additional configuration
   });
   ```

3. **Create Auth API Routes**
   - **Context7mcp**: Need BetterAuth Next.js 15 App Router setup
   - Set up auth endpoints for login, register, logout
   - Configure session handling

4. **Build Authentication UI Components**
   Create `apps/web/src/components/auth/`:
   - `LoginForm.tsx` - Parent login with email/password
   - `RegisterForm.tsx` - Parent registration with validation
   - `AuthGuard.tsx` - Protected route wrapper
   - `UserMenu.tsx` - Logged-in user dropdown

5. **Implement Auth Hooks**
   Create `apps/web/src/hooks/useAuth.ts`:
   ```typescript
   // Context7mcp: Need BetterAuth React hooks implementation
   export function useAuth() {
     // Implementation needed
   }

   export function useUser() {
     // Implementation needed
   }

   export function useSession() {
     // Implementation needed
   }
   ```

6. **Update Convex Schema for Auth**
   Extend the users table with BetterAuth fields:
   - **Context7mcp**: Need exact BetterAuth schema requirements

7. **Create Protected Routes**
   - Dashboard routes requiring authentication
   - Redirect logic for unauthenticated users
   - Loading states during auth checks

### Success Criteria
- [ ] Parents can register with email/password
- [ ] Login/logout functionality working
- [ ] Sessions persisted across page reloads
- [ ] Protected routes properly secured
- [ ] User data synced with Convex

## Task 5: Implement RetroUI Component System
**Time Estimate**: 3-4 hours
**Dependencies**: Task 4 completed

### Objectives
- Port RetroUI components to the shared UI package
- Adapt components for TypeScript strict mode
- Create Storybook setup for component documentation
- Implement theming system

### Detailed Steps

1. **Set up UI Package Structure**
   ```
   packages/ui/
   ├── src/
   │   ├── components/
   │   │   ├── Button/
   │   │   ├── Card/
   │   │   ├── Input/
   │   │   ├── Popup/
   │   │   ├── Dropdown/
   │   │   ├── Accordion/
   │   │   └── index.ts
   │   ├── styles/
   │   │   └── retroui.css
   │   └── index.ts
   ├── package.json
   └── tsconfig.json
   ```

2. **Port RetroUI Components**
   - Copy components from the my-app project
   - Add proper TypeScript types
   - Ensure "use client" directives where needed
   - Export all components from package

3. **Create Theme System**
   ```typescript
   // packages/ui/src/theme/index.ts
   export const retroTheme = {
     colors: {
       primary: "#fefcd0",
       secondary: "#c381b5",
       background: "#f4e5d3",
       text: "#000000",
       border: "#000000",
     },
     fonts: {
       minecraft: "Minecraft, monospace",
     },
     shadows: {
       retro: "4px 4px 0px",
     },
   };
   ```

4. **Set up Storybook (Optional but Recommended)**
   ```bash
   cd packages/ui
   pnpm dlx storybook@latest init
   ```
   - Create stories for each component
   - Document props and usage
   - **Context7mcp**: Need Storybook 7+ configuration for monorepo

5. **Configure Package Exports**
   Update `packages/ui/package.json`:
   ```json
   {
     "name": "@pommai/ui",
     "version": "0.0.1",
     "main": "./src/index.ts",
     "types": "./src/index.ts",
     "exports": {
       ".": "./src/index.ts",
       "./styles": "./src/styles/retroui.css"
     }
   }
   ```

6. **Integrate with Web App**
   - Import RetroUI components in web app
   - Apply global styles
   - Test all components work correctly

### Success Criteria
- [ ] All RetroUI components ported and typed
- [ ] Components accessible from web app
- [ ] Consistent theming applied
- [ ] No TypeScript errors
- [ ] Components render correctly

## Task 6: Create Parent Dashboard Skeleton
**Time Estimate**: 4-5 hours
**Dependencies**: Tasks 4-5 completed

### Objectives
- Build the main dashboard layout with navigation
- Create placeholder pages for all parent features
- Implement responsive design
- Set up routing structure

### Detailed Steps

1. **Create Dashboard Layout**
   Create `apps/web/src/app/(dashboard)/layout.tsx`:
   ```typescript
   import { AuthGuard } from "@/components/auth/AuthGuard";
   import { DashboardNav } from "@/components/dashboard/DashboardNav";
   import { RetroCard } from "@pommai/ui";

   export default function DashboardLayout({
     children,
   }: {
     children: React.ReactNode;
   }) {
     return (
       <AuthGuard>
         <div className="min-h-screen bg-retro-background">
           <DashboardNav />
           <main className="container mx-auto px-4 py-8">
             <RetroCard className="p-6">
               {children}
             </RetroCard>
           </main>
         </div>
       </AuthGuard>
     );
   }
   ```

2. **Build Navigation Component**
   Create `apps/web/src/components/dashboard/DashboardNav.tsx`:
   - Logo and branding
   - Navigation items: Toys, Conversations, Settings, Help
   - User menu with logout
   - Mobile-responsive hamburger menu

3. **Create Dashboard Pages Structure**
   ```
   apps/web/src/app/(dashboard)/
   ├── page.tsx                 # Dashboard home
   ├── toys/
   │   ├── page.tsx            # List all toys
   │   ├── new/page.tsx        # Create new toy wizard
   │   └── [id]/
   │       ├── page.tsx        # Toy details
   │       ├── edit/page.tsx   # Edit toy settings
   │       └── conversations/page.tsx
   ├── conversations/
   │   ├── page.tsx            # All conversations
   │   └── [id]/page.tsx       # Conversation detail
   ├── settings/
   │   ├── page.tsx            # Account settings
   │   ├── safety/page.tsx     # Safety preferences
   │   └── billing/page.tsx    # Subscription management
   └── help/
       └── page.tsx            # Help and documentation
   ```

4. **Implement Dashboard Home Page**
   Show overview cards with:
   - Active toys count
   - Recent conversations
   - Safety alerts
   - Quick actions

5. **Create Placeholder Components**
   For each section, create basic placeholder components:
   ```typescript
   // Example: apps/web/src/app/(dashboard)/toys/page.tsx
   import { RetroButton, RetroCard } from "@pommai/ui";
   import Link from "next/link";

   export default function ToysPage() {
     return (
       <div>
         <div className="flex justify-between items-center mb-6">
           <h1 className="text-3xl font-minecraft">My Toys</h1>
           <Link href="/toys/new">
             <RetroButton>Add New Toy</RetroButton>
           </Link>
         </div>
         
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
           {/* Placeholder for toy cards */}
           <RetroCard className="p-4">
             <p className="text-gray-500">No toys yet. Create your first toy!</p>
           </RetroCard>
         </div>
       </div>
     );
   }
   ```

6. **Add Loading and Error States**
   - Create loading skeletons
   - Error boundary components
   - Empty state illustrations

### Success Criteria
- [ ] Dashboard layout responsive and functional
- [ ] All navigation routes working
- [ ] Authentication properly protecting routes
- [ ] RetroUI components integrated throughout
- [ ] Placeholder pages for all features

## Task 7: Design and Implement Convex Database Functions
**Time Estimate**: 3-4 hours
**Dependencies**: Task 6 completed

### Objectives
- Create Convex mutations for CRUD operations
- Implement real-time queries for dashboard data
- Set up proper authorization checks
- Create helper functions for common operations

### Detailed Steps

1. **Create User Management Functions**
   Create `apps/web/convex/users.ts`:
   ```typescript
   import { mutation, query } from "./_generated/server";
   import { v } from "convex/values";

   export const getCurrentUser = query({
     handler: async (ctx) => {
       // Context7mcp: Need BetterAuth user retrieval pattern
       const identity = await ctx.auth.getUserIdentity();
       if (!identity) return null;
       
       return await ctx.db
         .query("users")
         .withIndex("by_email", (q) => q.eq("email", identity.email))
         .first();
     },
   });

   export const updateUserProfile = mutation({
     args: {
       name: v.string(),
       // Add other profile fields
     },
     handler: async (ctx, args) => {
       // Implementation needed
     },
   });
   ```

2. **Implement Toy Management Functions**
   Create `apps/web/convex/toys.ts`:
   ```typescript
   export const createToy = mutation({
     args: {
       name: v.string(),
       personality: v.string(),
       voiceId: v.string(),
       ageGroup: v.union(v.literal("3-5"), v.literal("6-8"), v.literal("9-12")),
     },
     handler: async (ctx, args) => {
       const user = await ctx.auth.getUserIdentity();
       if (!user) throw new Error("Unauthorized");

       return await ctx.db.insert("toys", {
         userId: user._id,
         ...args,
         safetySettings: {
           ageGroup: args.ageGroup,
           contentFilters: ["violence", "inappropriate", "scary"],
           maxConversationLength: 30,
         },
         isActive: true,
         createdAt: Date.now(),
       });
     },
   });

   export const listUserToys = query({
     handler: async (ctx) => {
       const user = await ctx.auth.getUserIdentity();
       if (!user) return [];

       return await ctx.db
         .query("toys")
         .withIndex("by_user", (q) => q.eq("userId", user._id))
         .collect();
     },
   });
   ```

3. **Create Conversation Functions**
   Create `apps/web/convex/conversations.ts`:
   - Log new conversations
   - Retrieve conversation history
   - Mark safety incidents
   - Calculate analytics

4. **Implement Real-time Subscriptions**
   ```typescript
   export const subscribeToToyConversations = query({
     args: { toyId: v.id("toys") },
     handler: async (ctx, args) => {
       // Verify user owns this toy
       const toy = await ctx.db.get(args.toyId);
       const user = await ctx.auth.getUserIdentity();
       
       if (toy?.userId !== user?._id) {
         throw new Error("Unauthorized");
       }

       return await ctx.db
         .query("conversations")
         .withIndex("by_toy", (q) => q.eq("toyId", args.toyId))
         .order("desc")
         .take(50);
     },
   });
   ```

5. **Add Helper Functions**
   Create `apps/web/convex/helpers.ts`:
   - Authorization checks
   - Data validation
   - Common queries
   - **Context7mcp**: Need Convex best practices for helper functions

6. **Set up Scheduled Functions**
   For automatic audio deletion after 24-48 hours:
   ```typescript
   // apps/web/convex/crons.ts
   import { cronJobs } from "convex/server";
   import { internal } from "./_generated/api";

   const crons = cronJobs();

   crons.hourly(
     "delete old audio",
     { hourUTC: 0, minuteUTC: 0 },
     internal.conversations.deleteOldAudio
   );

   export default crons;
   ```

### Success Criteria
- [ ] All CRUD operations implemented
- [ ] Real-time queries working
- [ ] Proper authorization on all functions
- [ ] Helper functions reduce code duplication
- [ ] Scheduled jobs configured

## Phase 1 Completion Checklist

### Technical Requirements
- [ ] Monorepo properly configured with Turborepo
- [ ] Next.js 15 app running with Convex backend
- [ ] Deployed to Vercel with automatic deployments
- [ ] BetterAuth authentication fully integrated
- [ ] RetroUI component system implemented
- [ ] Parent dashboard with all navigation routes
- [ ] Database schema and functions complete

### Quality Checks
- [ ] TypeScript strict mode with no errors
- [ ] ESLint passing on all code
- [ ] Mobile responsive design
- [ ] Loading states for all async operations
- [ ] Error handling implemented
- [ ] Environment variables documented

### Documentation
- [ ] README.md with setup instructions
- [ ] Environment variable template
- [ ] Basic API documentation
- [ ] Component usage examples

## Next Phase Preview
Phase 2 will focus on implementing the core features:
- Toy creation wizard with personality builder
- Voice selection and configuration
- Knowledge base management
- Real-time conversation monitoring
- Basic chat interface for testing

## Resources Needed
- **Context7mcp**: BetterAuth documentation and examples
- **Context7mcp**: Convex + BetterAuth integration patterns
- **Context7mcp**: Next.js 15 App Router best practices
- **Context7mcp**: Vercel monorepo deployment guide
- **GitHub Repo**: BetterAuth repository for reference
- **GitHub Repo**: Example projects using similar stack

## Support Requirements
When implementing these tasks, the following external resources will be needed:
1. BetterAuth setup documentation
2. Convex authentication adapter code
3. Example implementations of similar architectures
4. Performance optimization guidelines
5. Security best practices for child-focused applications

Each task should be completed in order, as they build upon each other. The estimated total time for Phase 1 is 40-50 hours of focused development work.
