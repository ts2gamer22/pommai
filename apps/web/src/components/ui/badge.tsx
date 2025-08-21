"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-solid border-[3px]",
  {
    variants: {
      variant: {
        default: "",
        secondary: "",
        destructive: "",
        outline: "bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  borderColor?: string
  bg?: string
  textColor?: string
}

function Badge({ className, variant, borderColor, bg, textColor, style, ...props }: BadgeProps) {
  const svgString = React.useMemo(() => {
    const color = borderColor || "#000000"
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><path d="M3 1h1v1h-1zM4 1h1v1h-1zM2 2h1v1h-1zM5 2h1v1h-1zM1 3h1v1h-1zM6 3h1v1h-1zM1 4h1v1h-1zM6 4h1v1h-1zM2 5h1v1h-1zM5 5h1v1h-1zM3 6h1v1h-1zM4 6h1v1h-1z" fill="${color}"/></svg>`
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
  }, [borderColor])

  const getDefaultColors = () => {
    switch (variant) {
      case "secondary":
        return { bg: "#e5e5e5", text: "#000000", border: "#666666" }
      case "destructive":
        return { bg: "#fee2e2", text: "#ff0000", border: "#ff0000" }
      case "outline":
        return { bg: "transparent", text: "#000000", border: "#000000" }
      default:
        return { bg: "#fefcd0", text: "#000000", border: "#000000" }
    }
  }

  const defaults = getDefaultColors()

  const customStyle = {
    ...style,
    backgroundColor: bg || defaults.bg,
    color: textColor || defaults.text,
    borderImageSource: svgString,
    borderImageSlice: 3,
    borderImageWidth: 1,
    borderImageRepeat: "stretch",
    borderImageOutset: 1,
    borderColor: borderColor || defaults.border,
  }

  return (
    <div
      className={cn(badgeVariants({ variant }), className)}
      style={customStyle}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
