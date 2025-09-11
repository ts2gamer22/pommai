"use client"

import * as React from "react"
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const AlertDialog = AlertDialogPrimitive.Root

const AlertDialogTrigger = AlertDialogPrimitive.Trigger

const AlertDialogPortal = AlertDialogPrimitive.Portal

/**
 * RetroUI-styled overlay for AlertDialog.
 */
const AlertDialogOverlay = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Overlay
    className={cn("pixel-popup-overlay", className)}
    {...props}
    ref={ref}
  />
))
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName

/**
 * RetroUI-styled AlertDialogContent matching Popup component.
 * Adds overlayClassName/contentClassName like Popup for consistency.
 */
interface AlertContentProps extends React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content> {
  overlayClassName?: string
  contentClassName?: string
  modalClassName?: string
  /** Optional title rendered as pixel header (use normal AlertDialogTitle if you prefer) */
  title?: string
  /** Renders a top-right close button inside the dialog */
  showClose?: boolean
  closeLabel?: string
}

const AlertDialogContent = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Content>,
  AlertContentProps
>(({ className, modalClassName, overlayClassName, contentClassName = "", children, title, showClose = true, closeLabel = "X", ...props }, ref) => {
  const svgString = React.useMemo(() => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><path d="M3 1h1v1h-1zM4 1h1v1h-1zM2 2h1v1h-1zM5 2h1v1h-1zM1 3h1v1h-1zM6 3h1v1h-1zM1 4h1v1h-1zM6 4h1v1h-1zM2 5h1v1h-1zM5 5h1v1h-1zM3 6h1v1h-1zM4 6h1v1h-1z" fill="black"/></svg>`
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
  }, [])

  const styleVars = {
    "--popup-border-svg": svgString,
  } as React.CSSProperties

  return (
    <AlertDialogPortal>
      <AlertDialogOverlay className={overlayClassName} />
      <AlertDialogPrimitive.Content
        ref={ref}
        className={cn(
          "fixed left-1/2 top-1/2 z-50 w-full -translate-x-1/2 -translate-y-1/2 pixel-popup",
          modalClassName || className
        )}
        style={styleVars}
        {...props}
      >
        <div className={cn("pixel-popup-inner", contentClassName)}>
          {title && <h2 className="pixel-popup-title">{title}</h2>}
          {showClose && (
            <AlertDialogPrimitive.Cancel asChild>
              <button className="pixel-popup-close-button" aria-label="Close dialog">{closeLabel}</button>
            </AlertDialogPrimitive.Cancel>
          )}
          {children}
        </div>
      </AlertDialogPrimitive.Content>
    </AlertDialogPortal>
  )
})
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName

const AlertDialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
AlertDialogHeader.displayName = "AlertDialogHeader"

const AlertDialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
AlertDialogFooter.displayName = "AlertDialogFooter"

const AlertDialogTitle = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold", className)}
    {...props}
  />
))
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName

const AlertDialogDescription = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
AlertDialogDescription.displayName =
  AlertDialogPrimitive.Description.displayName

const AlertDialogAction = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Action>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action>
>(({ className, formAction, children, ...props }, ref) => {
  // Filter out formAction if it's a function since our Button only accepts string formAction
  const buttonProps = typeof formAction === 'function' 
    ? { ...props, children }
    : { ...props, formAction, children };
    
  return (
    <AlertDialogPrimitive.Action ref={ref} className={cn("", className)} asChild>
      {/* Use RetroUI Button as the action */}
      <Button {...(buttonProps as unknown as React.ComponentProps<typeof Button>)} />
    </AlertDialogPrimitive.Action>
  )
})
AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName

const AlertDialogCancel = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Cancel>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel>
>(({ className, formAction, children, ...props }, ref) => {
  // Filter out formAction if it's a function since our Button only accepts string formAction
  const buttonProps = typeof formAction === 'function' 
    ? { ...props, children }
    : { ...props, formAction, children };
    
  return (
    <AlertDialogPrimitive.Cancel ref={ref} className={cn("", className)} asChild>
      {/* Use RetroUI Button as the cancel */}
      <Button bg="#e5e5e5" {...(buttonProps as unknown as React.ComponentProps<typeof Button>)} />
    </AlertDialogPrimitive.Cancel>
  )
})
AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
}
