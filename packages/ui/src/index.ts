/**
 * @file Main export file for @pommai/ui package
 * @description Exports all RetroUI components and types
 */

// Export all components with named exports
export { Button } from './components/Button';
export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './components/Card';
export { Input } from './components/Input';
export { Textarea } from './components/TextArea';
export { Label } from './components/Label';
export { ProgressBar } from './components/ProgressBar';
export { Progress } from './components/Progress';
export { Popup } from './components/Popup';
export { Bubble } from './components/Bubble';

// Export new form components
export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './components/Select';
export { Checkbox } from './components/Checkbox';
export { RadioGroup, RadioItem } from './components/RadioGroup';
export { Switch } from './components/Switch';
export { Slider } from './components/Slider';

// Export new layout components
export { 
  Dialog, 
  DialogTrigger, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from './components/Dialog';
export { 
  Sheet, 
  SheetTrigger, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription, 
  SheetFooter 
} from './components/Sheet';
export { Popover, PopoverTrigger, PopoverContent } from './components/Popover';
export { Tooltip, TooltipTrigger, TooltipContent } from './components/Tooltip';
export { Separator } from './components/Separator';

// Export new navigation components
export { 
  Breadcrumb, 
  BreadcrumbList, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbPage, 
  BreadcrumbSeparator, 
  BreadcrumbEllipsis 
} from './components/Breadcrumb';
export { 
  NavigationMenu, 
  NavigationMenuList, 
  NavigationMenuItem, 
  NavigationMenuTrigger, 
  NavigationMenuContent, 
  NavigationMenuLink, 
  NavigationMenuIndicator 
} from './components/NavigationMenu';

// Export new data display components
export { 
  Table, 
  TableHeader, 
  TableBody, 
  TableFooter, 
  TableRow, 
  TableHead, 
  TableCell, 
  TableCaption 
} from './components/Table';
export { Badge } from './components/Badge';
export { Avatar, AvatarImage, AvatarFallback } from './components/Avatar';
export { Alert, AlertTitle, AlertDescription } from './components/Alert';
export { Skeleton } from './components/Skeleton';

// Export Dropdown components
export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator
} from './components/Dropdown';

// Export Accordion components
export {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent
} from './components/Accordion';

// Export Tabs components
export {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent
} from './components/Tabs';

// Export all component types
export type { ButtonProps } from './components/Button';
export type { 
  CardProps, 
  CardHeaderProps, 
  CardTitleProps, 
  CardDescriptionProps, 
  CardContentProps, 
  CardFooterProps 
} from './components/Card';
export type { InputProps } from './components/Input';
export type { TextareaProps } from './components/TextArea';
export type { LabelProps } from './components/Label';
export type { ProgressBarProps } from './components/ProgressBar';
export type { ProgressProps } from './components/Progress';
export type { PopupProps } from './components/Popup';
export type { BubbleProps } from './components/Bubble';

// Export new form component types
export type { SelectProps, SelectTriggerProps, SelectValueProps, SelectContentProps, SelectItemProps, SelectOption } from './components/Select';
export type { CheckboxProps } from './components/Checkbox';
export type { RadioGroupProps, RadioItemProps, RadioOption } from './components/RadioGroup';
export type { SwitchProps } from './components/Switch';
export type { SliderProps } from './components/Slider';

// Export new layout component types
export type { 
  DialogProps, 
  DialogTriggerProps, 
  DialogContentProps, 
  DialogHeaderProps, 
  DialogTitleProps, 
  DialogDescriptionProps, 
  DialogFooterProps 
} from './components/Dialog';
export type { 
  SheetProps, 
  SheetTriggerProps, 
  SheetContentProps, 
  SheetHeaderProps, 
  SheetTitleProps, 
  SheetDescriptionProps, 
  SheetFooterProps 
} from './components/Sheet';
export type { PopoverProps, PopoverTriggerProps, PopoverContentProps } from './components/Popover';
export type { TooltipProps, TooltipTriggerProps, TooltipContentProps } from './components/Tooltip';
export type { SeparatorProps } from './components/Separator';

// Export new navigation component types
export type { 
  BreadcrumbProps, 
  BreadcrumbItem as BreadcrumbItemType, 
  BreadcrumbListProps, 
  BreadcrumbItemProps, 
  BreadcrumbLinkProps, 
  BreadcrumbPageProps, 
  BreadcrumbSeparatorProps, 
  BreadcrumbEllipsisProps 
} from './components/Breadcrumb';
export type { 
  NavigationMenuProps, 
  NavigationMenuListProps, 
  NavigationMenuItemProps, 
  NavigationMenuTriggerProps, 
  NavigationMenuContentProps, 
  NavigationMenuLinkProps, 
  NavigationMenuIndicatorProps 
} from './components/NavigationMenu';

// Export new data display component types
export type { 
  TableProps, 
  TableHeaderProps, 
  TableBodyProps, 
  TableFooterProps, 
  TableRowProps, 
  TableHeadProps, 
  TableCellProps, 
  TableCaptionProps 
} from './components/Table';
export type { BadgeProps } from './components/Badge';
export type { AvatarProps, AvatarImageProps, AvatarFallbackProps } from './components/Avatar';
export type { AlertProps, AlertTitleProps, AlertDescriptionProps } from './components/Alert';
export type { SkeletonProps } from './components/Skeleton';

// Export theme system
export { 
  defaultTheme, 
  themes, 
  componentThemes, 
  applyTheme, 
  createTheme, 
  generateBorderSvg, 
  generateArrowSvg 
} from './theme';
export type { RetroTheme } from './theme';

// Export comprehensive type system
export type * from './types';
export type {
  DropdownMenuProps,
  DropdownMenuTriggerProps,
  DropdownMenuContentProps
} from './components/Dropdown';
export type {
  AccordionProps,
  AccordionItemProps,
  AccordionTriggerProps,
  AccordionContentProps
} from './components/Accordion';
export type {
  TabsProps,
  TabsListProps,
  TabsTriggerProps,
  TabsContentProps
} from './components/Tabs';
