import { createAuthClient } from "better-auth/react";
import { convexClient, crossDomainClient } from "@convex-dev/better-auth/client/plugins";

export const authClient = createAuthClient({
  // Point to Convex site URL so Better Auth endpoints are hit on Convex
  baseURL: process.env.NEXT_PUBLIC_CONVEX_URL!,
  plugins: [
    convexClient(),
    crossDomainClient(),
  ],
});
