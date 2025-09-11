import { httpRouter } from 'convex/server'
import { httpAction } from './_generated/server'
import { betterAuthComponent } from './auth'
import { createAuth } from '../src/lib/auth'
import { resend } from './emails'

const http = httpRouter()

// Register BetterAuth routes
betterAuthComponent.registerRoutes(http, createAuth)

// Resend webhook route
http.route({
  path: '/resend-webhook',
  method: 'POST',
  handler: httpAction(async (ctx, req) => {
    return await resend.handleResendEventWebhook(ctx, req)
  }),
})

export default http
