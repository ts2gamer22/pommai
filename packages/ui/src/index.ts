/**
 * @file Main export file for @pommai/ui package
 * @description Exports all RetroUI components and types
 */

// Export all components with named exports
export { Button } from './components/Button';
export { Card } from './components/Card';
export { Input } from './components/Input';
export { TextArea } from './components/TextArea';
export { ProgressBar } from './components/ProgressBar';
export { Popup } from './components/Popup';
export { Bubble } from './components/Bubble';

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
export type { CardProps } from './components/Card';
export type { InputProps } from './components/Input';
export type { TextAreaProps } from './components/TextArea';
export type { ProgressBarProps } from './components/ProgressBar';
export type { PopupProps } from './components/Popup';
export type { BubbleProps } from './components/Bubble';
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
