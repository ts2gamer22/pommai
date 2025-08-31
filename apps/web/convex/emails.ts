import { components, internal } from "./_generated/api";
import { Resend } from "@convex-dev/resend";
import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

// Initialize Resend with test mode for development
// Set testMode to false in production
export const resend = new Resend(components.resend, {
  // testMode defaults to true for safety
  // In production, set this to false via environment variable
  testMode: process.env.NODE_ENV !== "production",
});

/**
 * Send verification email
 */
export const sendVerificationEmail = internalMutation({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
    verificationUrl: v.string(),
  },
  handler: async (ctx, { email, name, verificationUrl }) => {
    const APP_NAME = "Pommai";
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email - ${APP_NAME}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #c381b5 0%, #92cd41 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .header h1 { color: white; margin: 0; font-size: 28px; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 14px 30px; background: #c381b5; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            .warning { background: #fef5e7; border-left: 4px solid #f39c12; padding: 15px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🧸 Welcome to ${APP_NAME}!</h1>
            </div>
            <div class="content">
              <h2>Verify Your Email Address</h2>
              <p>Hi ${name || 'there'},</p>
              <p>Thank you for signing up for ${APP_NAME} - the safe AI companion platform for children! Please verify your email address by clicking the button below:</p>
              
              <div style="text-align: center;">
                <a href="${verificationUrl}" class="button">Verify Email Address</a>
              </div>
              
              <div class="warning">
                <strong>⚠️ Important:</strong> This verification link will expire in 1 hour.
              </div>
              
              <p style="color: #666; font-size: 14px;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <span style="color: #c381b5; word-break: break-all;">${verificationUrl}</span>
              </p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} ${APP_NAME}. Safe AI Companions for Children.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `Welcome to ${APP_NAME}! Please verify your email by visiting: ${verificationUrl}. This link will expire in 1 hour.`;

    // Use the correct FROM email based on environment
    const fromEmail = process.env.NODE_ENV === "production" 
      ? "noreply@pommai.com" // Update with your verified domain
      : "delivered@resend.dev"; // Test email for development

    const emailId = await resend.sendEmail(ctx, {
      from: `${APP_NAME} <${fromEmail}>`,
      to: email,
      subject: `🧸 Verify your email for ${APP_NAME}`,
      html,
      text,
    });

    console.log("Verification email sent:", emailId);
    return emailId;
  },
});

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = internalMutation({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
    resetUrl: v.string(),
  },
  handler: async (ctx, { email, name, resetUrl }) => {
    const APP_NAME = "Pommai";
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password - ${APP_NAME}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #e74c3c 0%, #c381b5 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .header h1 { color: white; margin: 0; font-size: 28px; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 14px 30px; background: #e74c3c; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            .warning { background: #fef5e7; border-left: 4px solid #f39c12; padding: 15px; margin: 20px 0; }
            .security-tip { background: #e8f6f3; border-left: 4px solid #27ae60; padding: 15px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔒 Password Reset Request</h1>
            </div>
            <div class="content">
              <h2>Reset Your Password</h2>
              <p>Hi ${name || 'there'},</p>
              <p>We received a request to reset your password for your ${APP_NAME} account. Click the button below to create a new password:</p>
              
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </div>
              
              <div class="warning">
                <strong>⚠️ Important:</strong> This password reset link will expire in 1 hour.
              </div>
              
              <div class="security-tip">
                <strong>🛡️ Security Tip:</strong> If you didn't request this password reset, please ignore this email. Your password won't be changed.
              </div>
              
              <p style="color: #666; font-size: 14px;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <span style="color: #e74c3c; word-break: break-all;">${resetUrl}</span>
              </p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} ${APP_NAME}. Safe AI Companions for Children.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `Password reset requested for your ${APP_NAME} account. Reset your password by visiting: ${resetUrl}. This link will expire in 1 hour.`;

    const fromEmail = process.env.NODE_ENV === "production" 
      ? "noreply@pommai.com" // Update with your verified domain
      : "delivered@resend.dev"; // Test email for development

    const emailId = await resend.sendEmail(ctx, {
      from: `${APP_NAME} <${fromEmail}>`,
      to: email,
      subject: `🔒 Password Reset Request - ${APP_NAME}`,
      html,
      text,
    });

    console.log("Password reset email sent:", emailId);
    return emailId;
  },
});

/**
 * Send welcome email after verification
 */
export const sendWelcomeEmail = internalMutation({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
  },
  handler: async (ctx, { email, name }) => {
    const APP_NAME = "Pommai";
    const APP_URL = process.env.SITE_URL || "https://pommai.com";
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to ${APP_NAME}!</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #92cd41 0%, #c381b5 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .header h1 { color: white; margin: 0; font-size: 28px; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 14px 30px; background: #92cd41; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
            .feature { background: white; padding: 15px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #c381b5; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to ${APP_NAME}! 🎉</h1>
            </div>
            <div class="content">
              <h2>Your Email is Verified!</h2>
              <p>Hi ${name || 'there'},</p>
              <p>Your email has been successfully verified! You're now ready to create magical AI companions for your children.</p>
              
              <h3>What you can do now:</h3>
              
              <div class="feature">
                <strong>🎨 Create Custom Toys</strong><br>
                Design unique AI companions with personalities that match your child's interests
              </div>
              
              <div class="feature">
                <strong>🛡️ Guardian Mode</strong><br>
                Monitor conversations, set content filters, and ensure safe interactions
              </div>
              
              <div class="feature">
                <strong>📚 Educational Content</strong><br>
                Your AI toys can help with learning, storytelling, and creative play
              </div>
              
              <div style="text-align: center;">
                <a href="${APP_URL}/dashboard" class="button">Go to Dashboard</a>
              </div>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} ${APP_NAME}. Safe AI Companions for Children.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `Welcome to ${APP_NAME}! Your email has been verified and your account is ready. Visit ${APP_URL}/dashboard to get started.`;

    const fromEmail = process.env.NODE_ENV === "production" 
      ? "noreply@pommai.com" // Update with your verified domain
      : "delivered@resend.dev"; // Test email for development

    const emailId = await resend.sendEmail(ctx, {
      from: `${APP_NAME} <${fromEmail}>`,
      to: email,
      subject: `🎉 Welcome to ${APP_NAME} - Your Account is Ready!`,
      html,
      text,
    });

    console.log("Welcome email sent:", emailId);
    return emailId;
  },
});
