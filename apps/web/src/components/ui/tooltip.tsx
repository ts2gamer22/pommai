"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface TooltipContextValue {
  open: boolean
  setOpen: (open: boolean) => void
}

const TooltipContext = React.createContext<TooltipContextValue>({
  open: false,
  setOpen: () => {},
})

export const TooltipProvider = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = React.useState(false)

  return (
    <TooltipContext.Provider value={{ open, setOpen }}>
      {children}
    </TooltipContext.Provider>
  )
}

export const Tooltip = ({ children }: { children: React.ReactNode }) => {
  return <div className="relative inline-block">{children}</div>
}

export const TooltipTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, onMouseEnter, onMouseLeave, ...props }, ref) => {
  const { setOpen } = React.useContext(TooltipContext)

  return (
    <button
      ref={ref}
      className={cn("", className)}
      onMouseEnter={(e) => {
        setOpen(true)
        onMouseEnter?.(e)
      }}
      onMouseLeave={(e) => {
        setOpen(false)
        onMouseLeave?.(e)
      }}
      {...props}
    />
  )
})
TooltipTrigger.displayName = "TooltipTrigger"

export const TooltipContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { open } = React.useContext(TooltipContext)

  if (!open) return null

  return (
    <div
      ref={ref}
      className={cn(
        "absolute z-50 px-3 py-1.5 text-sm",
        "bg-[var(--bg-popup)] text-[var(--text-popup)]",
        "border-solid border-[3px] border-black",
        "bottom-full left-1/2 transform -translate-x-1/2 mb-2",
        "pointer-events-none",
        className
      )}
      style={{
        borderImageSlice: 3,
        borderImageWidth: 1,
        borderImageRepeat: "stretch",
        borderImageSource: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8'%3E%3Cpath d='M3 1h1v1h-1zM4 1h1v1h-1zM2 2h1v1h-1zM5 2h1v1h-1zM1 3h1v1h-1zM6 3h1v1h-1zM1 4h1v1h-1zM6 4h1v1h-1zM2 5h1v1h-1zM5 5h1v1h-1zM3 6h1v1h-1zM4 6h1v1h-1z' fill='black'/%3E%3C/svg%3E")`,
      }}
      {...props}
    />
  )
})
TooltipContent.displayName = "TooltipContent"
