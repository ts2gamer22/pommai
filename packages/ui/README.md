# @pommai/ui

A comprehensive RetroUI design system for React applications with pixel art styling and modern accessibility features.

## Features

- 🎨 **Pixel Art Aesthetic**: Consistent retro styling with pixel borders and shadows
- 🎯 **TypeScript First**: Full type safety with comprehensive prop definitions
- ♿ **Accessible**: WCAG compliant components with proper ARIA attributes
- 🎨 **Themeable**: CSS custom properties for easy customization
- 📱 **Responsive**: Mobile-first design with responsive variants
- 🔧 **Developer Experience**: Excellent IntelliSense and documentation

## Installation

```bash
npm install @pommai/ui
# or
pnpm add @pommai/ui
# or
yarn add @pommai/ui
```

## Usage

### Basic Setup

Import the CSS styles in your app:

```tsx
import '@pommai/ui/styles'
```

### Using Components

```tsx
import { Button, Card, Input } from '@pommai/ui'

function App() {
  return (
    <Card>
      <h2>Welcome to RetroUI</h2>
      <Input placeholder="Enter your name" />
      <Button variant="primary">
        Get Started
      </Button>
    </Card>
  )
}
```

### Theming

```tsx
import { applyTheme, themes } from '@pommai/ui'

// Apply a predefined theme
applyTheme(themes.dark)

// Create a custom theme
import { createTheme } from '@pommai/ui'

const customTheme = createTheme({
  colors: {
    primary: '#ff6b6b',
    secondary: '#4ecdc4',
    background: '#f7f7f7'
  }
})

applyTheme(customTheme)
```

## Components

### Form Components
- `Button` - Interactive buttons with variants and states
- `Input` - Text inputs with icon support
- `TextArea` - Multi-line text inputs
- `Select` - Dropdown selection with search
- `Checkbox` - Checkboxes with custom styling
- `RadioGroup` & `RadioItem` - Radio button groups
- `Switch` - Toggle switches
- `Slider` - Range inputs

### Layout Components
- `Card` - Content containers with sub-components
- `Dialog` - Modal dialogs
- `Sheet` - Side panels and drawers
- `Popover` - Floating content containers
- `Tooltip` - Hover information
- `Separator` - Visual dividers

### Navigation Components
- `Tabs` - Tab navigation
- `Breadcrumb` - Navigation trails
- `NavigationMenu` - Complex navigation menus
- `DropdownMenu` - Context menus

### Data Display Components
- `Table` - Data tables with sorting
- `Badge` - Status indicators
- `Avatar` - User profile images
- `Alert` - Status messages
- `Skeleton` - Loading placeholders
- `ProgressBar` - Progress indicators

### Feedback Components
- `Popup` - Modal overlays
- `Bubble` - Speech bubbles

## Styling

All components support RetroUI theming props:

```tsx
<Button 
  bg="#ff6b6b"
  textColor="#ffffff"
  borderColor="#d63031"
  shadow="#b71c1c"
>
  Custom Styled Button
</Button>
```

### CSS Custom Properties

Components use CSS custom properties for theming:

```css
:root {
  --retro-primary: #000000;
  --retro-secondary: #666666;
  --retro-background: #ffffff;
  --retro-surface: #f0f0f0;
  --retro-border: #000000;
  --retro-shadow: #000000;
  --retro-accent: #c381b5;
}
```

## TypeScript

Full TypeScript support with comprehensive prop definitions:

```tsx
import type { ButtonProps, CardProps } from '@pommai/ui'

const MyButton: React.FC<ButtonProps> = (props) => {
  return <Button {...props} />
}
```

## Accessibility

All components follow WCAG guidelines:

- Proper ARIA attributes
- Keyboard navigation support
- Screen reader compatibility
- Focus management
- Color contrast compliance

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

See the main repository for contribution guidelines.

## License

MIT License - see LICENSE file for details.