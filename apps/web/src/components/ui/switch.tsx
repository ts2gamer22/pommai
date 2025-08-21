"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SwitchProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ className, checked = false, onCheckedChange, disabled, ...props }, ref) => {
    const [isChecked, setIsChecked] = React.useState(checked)
    const currentChecked = checked !== undefined ? checked : isChecked

    const handleClick = () => {
      if (disabled) return
      const newChecked = !currentChecked
      setIsChecked(newChecked)
      onCheckedChange?.(newChecked)
    }

    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={currentChecked}
        onClick={handleClick}
        disabled={disabled}
        className={cn(
          "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center",
          "border-2 border-[var(--border-button)] bg-[var(--bg-input)]",
          "transition-colors focus-visible:outline-none focus-visible:ring-2",
          "focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          currentChecked && "bg-[var(--color-progressbar)]",
          className
        )}
        {...props}
      >
        <span
          className={cn(
            "pointer-events-none block h-4 w-4",
            "bg-[var(--border-button)] transition-transform",
            currentChecked ? "translate-x-5" : "translate-x-1"
          )}
        />
      </button>
    )
  }
)
Switch.displayName = "Switch"

export { Switch }
