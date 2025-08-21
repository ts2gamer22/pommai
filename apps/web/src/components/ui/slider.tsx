"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SliderProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number[]
  onValueChange?: (value: number[]) => void
  max?: number
  min?: number
  step?: number
  disabled?: boolean
}

/**
 * RetroUI Slider
 * - Track styled like pixel-progressbar-container (sm)
 * - Range styled like pixel-progressbar (filled portion)
 * - Thumb is a square block with pixel border and hard shadow, press-down on active
 */
const Slider = React.forwardRef<HTMLDivElement, SliderProps>(
  ({ className, value = [0], onValueChange, max = 100, min = 0, step = 1, disabled, ...props }, ref) => {
    const [internalValue, setInternalValue] = React.useState(value)
    const currentValue = value || internalValue

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = [parseInt(e.target.value)]
      setInternalValue(newValue)
      onValueChange?.(newValue)
    }

    const percentage = ((currentValue[0] - min) / (max - min)) * 100

    return (
      <div
        ref={ref}
        className={cn("relative flex w-full touch-none select-none items-center", className)}
        {...props}
      >
        <div className="relative w-full">
          {/* Track */}
          <div className="pixel-progressbar-container pixel-progressbar-sm">
            {/* Filled range */}
            <div
              className="pixel-progressbar"
              style={{ width: `${percentage}%` }}
            />
          </div>

          {/* Invisible native range for interaction */}
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={currentValue[0]}
            onChange={handleChange}
            disabled={disabled}
            className="absolute top-0 left-0 w-full h-8 opacity-0 cursor-pointer"
          />

          {/* Thumb */}
          <div
            className="absolute top-1/2 w-6 h-6 -translate-y-1/2 -translate-x-1/2 bg-[var(--bg-button)] border-[5px] border-solid"
            style={{
              left: `${percentage}%`,
              borderColor: "var(--border-button, #000000)",
              boxShadow: "2px 2px 0 2px var(--shadow-button, #000000), -2px -2px 0 2px var(--bg-button, #f0f0f0)",
            }}
          />
        </div>
      </div>
    )
  }
)
Slider.displayName = "Slider"

export { Slider }
