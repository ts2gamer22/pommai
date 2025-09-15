import { httpRouter } from 'convex/server'
import { httpAction } from './_generated/server'
import { betterAuthComponent } from './auth'
import { createAuth } from '../src/lib/auth'
import { resend } from './emails'

const http = httpRouter()

// Register BetterAuth routes with CORS enabled for cross-domain cookie flow
betterAuthComponent.registerRoutes(http, createAuth, { cors: true })

// Resend webhook route
http.route({
  path: '/resend-webhook',
  method: 'POST',
  handler: httpAction(async (ctx, req) => {
    return await resend.handleResendEventWebhook(ctx, req)
  }),
})

export default http
