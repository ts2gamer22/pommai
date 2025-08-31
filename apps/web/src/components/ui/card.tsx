"use client"

import * as React from 'react'

export { Card, type CardProps } from '@pommai/ui'

// Additional exports for shadcn/ui compatibility
export const CardHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`p-6 ${className || ''}`} {...props} />
)
CardHeader.displayName = "CardHeader"

export const CardTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={`text-2xl font-semibold leading-none tracking-tight ${className || ''}`} {...props} />
)
CardTitle.displayName = "CardTitle"

export const CardDescription = ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={`text-sm text-muted-foreground ${className || ''}`} {...props} />
)
CardDescription.displayName = "CardDescription"

export const CardContent = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`p-6 pt-0 ${className || ''}`} {...props} />
)
CardContent.displayName = "CardContent"

export const CardFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`flex items-center p-6 pt-0 ${className || ''}`} {...props} />
)
CardFooter.displayName = "CardFooter"
