"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface RadioGroupProps extends Omit<React.ComponentPropsWithoutRef<"div">, "onChange"> {
  value?: string
  onValueChange?: (value: string) => void
  defaultValue?: string
  name?: string
}

const RadioGroupContext = React.createContext<{
  value?: string
  onValueChange?: (value: string) => void
  name?: string
}>({})

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ className, value, onValueChange, defaultValue, name, children, ...props }, ref) => {
    const [internalValue, setInternalValue] = React.useState(defaultValue || "")
    
    const contextValue = React.useMemo(
      () => ({
        value: value ?? internalValue,
        onValueChange: onValueChange ?? setInternalValue,
        name: name || "radio-group-" + Math.random().toString(36).substr(2, 9),
      }),
      [value, internalValue, onValueChange, name]
    )

    return (
      <RadioGroupContext.Provider value={contextValue}>
        <div
          ref={ref}
          className={cn("grid gap-2", className)}
          role="radiogroup"
          {...props}
        >
          {children}
        </div>
      </RadioGroupContext.Provider>
    )
  }
)
RadioGroup.displayName = "RadioGroup"

interface RadioGroupItemProps extends Omit<React.ComponentPropsWithoutRef<"input">, "type" | "onChange"> {
  value: string
}

const RadioGroupItem = React.forwardRef<HTMLInputElement, RadioGroupItemProps>(
  ({ className, value, ...props }, ref) => {
    const context = React.useContext(RadioGroupContext)
    const isChecked = context.value === value

    return (
      <input
        ref={ref}
        type="radio"
        name={context.name}
        value={value}
        checked={isChecked}
        onChange={(e) => {
          if (e.target.checked) {
            context.onValueChange?.(value)
          }
        }}
        className={cn(
          "h-5 w-5 border-[3px] border-black focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          "appearance-none relative bg-[var(--bg-input)] cursor-pointer",
          "before:content-[''] before:absolute before:inset-[2px] before:scale-0 before:transition-transform before:rounded-full",
          "checked:before:scale-100 before:bg-black",
          "hover:shadow-[2px_2px_0_0_var(--shadow-button)]",
          className
        )}
        {...props}
      />
    )
  }
)
RadioGroupItem.displayName = "RadioGroupItem"

export { RadioGroup, RadioGroupItem }
