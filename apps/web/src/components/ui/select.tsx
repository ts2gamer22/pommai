"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"

interface SelectContextValue {
  value?: string
  onValueChange?: (value: string) => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const SelectContext = React.createContext<SelectContextValue>({})

interface SelectProps {
  children: React.ReactNode
  value?: string
  onValueChange?: (value: string) => void
  defaultValue?: string
}

const Select = ({ children, value, onValueChange, defaultValue }: SelectProps) => {
  const [open, setOpen] = React.useState(false)
  const [internalValue, setInternalValue] = React.useState(defaultValue || "")

  const contextValue = React.useMemo(
    () => ({
      value: value ?? internalValue,
      onValueChange: onValueChange ?? setInternalValue,
      open,
      onOpenChange: setOpen,
    }),
    [value, internalValue, onValueChange, open]
  )

  return (
    <SelectContext.Provider value={contextValue}>
      <div className="relative inline-block">{children}</div>
    </SelectContext.Provider>
  )
}

const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
  const { open, onOpenChange } = React.useContext(SelectContext)

  return (
    <button
      ref={ref}
      className={cn(
        "pixel-button flex h-10 w-full items-center justify-between px-3 py-2 text-sm",
        "focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      onClick={() => onOpenChange?.(!open)}
      aria-expanded={open}
      aria-haspopup="listbox"
      type="button"
      {...props}
      style={{
        // ensure the pixel border renders using the same SVG pattern as other components via CSS var fallback
        // If your theming sets --button-custom-* vars, pixel-button will honor them.
      }}
    >
      {children}
      <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
    </button>
  )
})
SelectTrigger.displayName = "SelectTrigger"

const SelectValue = ({ placeholder }: { placeholder?: string }) => {
  const { value } = React.useContext(SelectContext)
  return <span className={!value ? "text-muted-foreground" : ""}>{value || placeholder}</span>
}

interface SelectContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const SelectContent = React.forwardRef<HTMLDivElement, SelectContentProps>(
  ({ className, children, ...props }, ref) => {
    const { open } = React.useContext(SelectContext)

    if (!open) return null

    return (
      <div
        ref={ref}
        className={cn(
          "absolute z-50 mt-1 max-h-60 w-full overflow-auto dropdown-menu-content",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
SelectContent.displayName = "SelectContent"

interface SelectItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
}

const SelectItem = React.forwardRef<HTMLDivElement, SelectItemProps>(
  ({ className, children, value, ...props }, ref) => {
    const { value: selectedValue, onValueChange, onOpenChange } = React.useContext(SelectContext)
    const isSelected = selectedValue === value

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex cursor-pointer select-none items-center px-3 py-2 text-sm outline-none dropdown-menu-item",
          isSelected && "bg-[var(--shadow-dropdown)] text-white",
          "disabled:pointer-events-none disabled:opacity-50",
          className
        )}
        onClick={() => {
          onValueChange?.(value)
          onOpenChange?.(false)
        }}
        {...props}
      >
        {children}
      </div>
    )}
)
SelectItem.displayName = "SelectItem"

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem }
