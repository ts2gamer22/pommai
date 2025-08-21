"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef<
  HTMLInputElement,
  React.ComponentPropsWithoutRef<"input">
>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      type="checkbox"
      className={cn(
        "h-5 w-5 border-[3px] border-black focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        "appearance-none relative bg-[var(--bg-input)] cursor-pointer",
        "before:content-[''] before:absolute before:inset-[2px] before:scale-0 before:transition-transform",
        "checked:before:scale-100 checked:before:bg-black",
        "checked:bg-[var(--bg-input)]",
        "hover:shadow-[2px_2px_0_0_var(--shadow-button)]",
        className
      )}
      {...props}
    />
  )
})
Checkbox.displayName = "Checkbox"

export { Checkbox }
