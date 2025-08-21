"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"

const alertVariants = cva(
  "relative w-full p-4 [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg+div]:pl-7 border-solid border-[5px] text-base",
  {
    variants: {
      variant: {
        default: "",
        destructive: "",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  borderColor?: string
  bg?: string
  textColor?: string
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant, borderColor, bg, textColor, style, ...props }, ref) => {
    const svgString = React.useMemo(() => {
      const color = borderColor || (variant === "destructive" ? "#ff0000" : "#000000")
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><path d="M3 1h1v1h-1zM4 1h1v1h-1zM2 2h1v1h-1zM5 2h1v1h-1zM1 3h1v1h-1zM6 3h1v1h-1zM1 4h1v1h-1zM6 4h1v1h-1zM2 5h1v1h-1zM5 5h1v1h-1zM3 6h1v1h-1zM4 6h1v1h-1z" fill="${color}"/></svg>`
      return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
    }, [borderColor, variant])

    const customStyle = {
      ...style,
      backgroundColor: bg || (variant === "destructive" ? "#fee2e2" : "#fefcd0"),
      color: textColor || "#000000",
      borderImageSource: svgString,
      borderImageSlice: 3,
      borderImageWidth: 2,
      borderImageRepeat: "stretch",
      borderImageOutset: 2,
      borderColor: borderColor || (variant === "destructive" ? "#ff0000" : "#000000"),
      boxShadow: `2px 2px 0 2px ${borderColor || (variant === "destructive" ? "#ff0000" : "#c381b5")}, -2px -2px 0 2px ${bg || (variant === "destructive" ? "#fee2e2" : "#fefcd0")}`,
    }

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(alertVariants({ variant }), className)}
        style={customStyle}
        {...props}
      />
    )
  }
)
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-bold leading-none tracking-tight", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }
