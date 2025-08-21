================================================
FILE: README.md
================================================
# Pixel RetroUI

[RetroUI](https://www.retroui.io/) is a pixelated UI component library for React and Next.js applications with a retro gaming aesthetic.

<img width="1512" alt="Pixel RetroUI Screenshot" src="https://github.com/user-attachments/assets/f54081b1-a913-4574-aac1-b5b043b566a4" />

## Features

- Pixelated, retro gaming-inspired components
- Seamless integration with React and Next.js
- TypeScript support
- Tailwind CSS compatible

## Quick Start

### Setup

#### CLI Setup (Recommended)
1. In your terminal:
   ```bash
   npx pixel-retroui
   ```
   Follow the instructions in the CLI. It will automatically install dependencies, configure your project, and create necessary setup files.

2. For Next.js, in your layout.tsx file add: `import '@/lib/pixel-retroui-setup.js';`

#### Manual Setup

1. Install the package:
    ```bash
   npm i pixel-retroui@latest
   ```

3. Add to your CSS file:
   ```css
   @import 'pixel-retroui/dist/index.css';
   /* For Minecraft font */
   @import 'pixel-retroui/dist/fonts.css';
   ```

### Basic Usage
Simply import and use:
```jsx
import { Button, Card } from 'pixel-retroui';

function App() {
  return (
    <div>
      <h1 className="font-minecraft">Retro App</h1>
      <Card className="p-4 mb-4">
        <p>This is a pixel-styled card</p>
      </Card>
      <Button>Click me!</Button>
    </div>
  );
}
```

## Components

Pixel RetroUI includes the following components:

| Component | Description |
|-----------|-------------|
| [Accordion](https://retroui.io/accordion) | Collapsible content sections |
| [Bubble](https://retroui.io/bubble) | Speech/thought bubble elements |
| [Button](https://retroui.io/button) | Customizable buttons with pixel styling |
| [Card](https://retroui.io/card) | Container for content with pixel borders |
| [Dropdown](https://retroui.io/dropdown) | Selectable dropdown menus |
| [Input](https://retroui.io/input) | Text input fields |
| [Popup](https://retroui.io/popup) | Modal dialogs and notifications |
| [ProgressBar](https://retroui.io/progressbar) | Visual progress indicators |
| [TextArea](https://retroui.io/textarea) | Multi-line text input fields |

Visit our [components page](https://retroui.io/components) for detailed documentation and examples.

## Customization

Components can be customized using props and Tailwind CSS classes:

```jsx
<Button 
  bg="#c381b5" 
  textColor="#fefcd0"
  shadow="#fefcd0"
  className="px-6 py-2"
>
  Custom Button
</Button>
```

## Troubleshooting

Common issues:

- **Fonts not loading**: Ensure you've imported `pixel-retroui/dist/fonts.css`
- **Components not styled**: Check you've imported `pixel-retroui/dist/index.css`
- **Tailwind conflicts**: Add `important: true` in your tailwind.config.js

## Contributing

We welcome contributions! See our [contribution guidelines](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request (make it as detailed as possible :))

## Support

- [GitHub Issues](https://github.com/Dksie09/RetroUI/issues)
- [Documentation repo](https://github.com/Dksie09/retroui-docs)

## License

This project is licensed under the BSD 3-Clause License - see the [LICENSE](LICENSE) file for details.

---

If you find this library useful, consider [buying me a coffee](https://buymeacoffee.com/dakshiegoel) ☕



================================================
FILE: CONTRIBUTING.md
================================================
# Contributing to Retro UI

We love your input! We want to make contributing to this project as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## We Develop with Github

We use github to host code, to track issues and feature requests, as well as accept pull requests.

## We Use [Github Flow](https://guides.github.com/introduction/flow/index.html), So All Code Changes Happen Through Pull Requests

Pull requests are the best way to propose changes to the codebase. We actively welcome your pull requests:

1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints.
6. Issue that pull request!

## Any contributions you make will be under the BSD 3-Clause License

In short, when you submit code changes, your submissions are understood to be under the same [BSD 3-Clause License](LICENSE) that covers the project. Feel free to contact the maintainers if that's a concern.

## Report bugs using Github's [issues](https://github.com/Dksie09/RetroUI/issues)

We use GitHub issues to track public bugs. Report a bug by [opening a new issue](https://github.com/Dksie09/RetroUI/issues/new); it's that easy!

## Write bug reports with detail, background, and sample code

**Great Bug Reports** tend to have:

- A quick summary and/or background
- Steps to reproduce
  - Be specific!
  - Give sample code if you can.
- What you expected would happen
- What actually happens
- Notes (possibly including why you think this might be happening, or stuff you tried that didn't work)

## Local Development

To set up for local development:

1. Fork the repository and clone your fork:

   ```bash
   git clone https://github.com/your-username/RetroUI.git
   cd RetroUI
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the Storybook development environment:

   ```bash
   npm run dev
   ```

   This will launch Storybook at http://localhost:6006, where you can preview and interact with all components.

4. Make your changes to components in the `/src/components` directory.

   - Components will automatically update in Storybook as you save changes
   - Use the watch mode for continuous builds during development: `npm run watch`

5. Test your changes:

   ```bash
   npm test
   ```

6. Build the library to verify your changes work in the final bundle:

   ```bash
   npm run build
   ```

7. To test your changes in another project:

   ```bash
   # In your RetroUI directory
   npm link

   # In your test project directory
   npm link pixel-retroui
   ```

## Project Structure

- `/src/components/` - All UI components with their styles, tests and stories
- `/src/styles/` - Global styles and theme variables
- `/.storybook/` - Storybook configuration files
- `/dist/` - Built package (generated when you run `npm run build`)
- `/fonts/` - Font files used by the library
- `/bin/` - Installation scripts

## Use a Consistent Coding Style

- 2 spaces for indentation rather than tabs
- Follow the project's TypeScript coding conventions

## Scripts

The project includes several useful npm scripts:

- `npm run dev` - Start Storybook development environment
- `npm run build` - Build the library for production
- `npm test` - Run the test suite
- `npm run watch` - Watch mode for development (continuously rebuilds on changes)

## Running Tests

Before submitting a pull request, make sure to run the test suite:

```bash
npm test
```

This will run all the tests and ensure that your changes haven't introduced any regressions.

## License

By contributing, you agree that your contributions will be licensed under its BSD 3-Clause License.



================================================
FILE: jest.config.js
================================================
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: ['<rootDir>/src/setup.ts'],
    moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
    }
};


================================================
FILE: LICENSE
================================================
BSD 3-Clause License

Copyright (c) 2024, Dakshi Goel
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
3. Neither the name of retroui nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.



================================================
FILE: package.json
================================================
{
  "name": "pixel-retroui",
  "version": "2.1.0",
  "description": "A retro-styled UI component library",
  "main": "dist/index.js",
  "module": "dist/index.js",
  "types": "dist/index.d.ts",
  "bin": {
    "pixel-retroui": "bin/install.js"
  },
  "scripts": {
    "build": "rollup -c rollup.config.mjs",
    "test": "jest",
    "watch": "rollup -c rollup.config.mjs -w",
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build",
    "dev": "storybook dev -p 6006"
  },
  "dependencies": {
    "chalk": "^4.1.2",
    "inquirer": "^8.2.6",
    "react": "^17.0.0 || ^18.0.0 || ^19.0.0",
    "react-dom": "^17.0.0 || ^18.0.0 || ^19.0.0",
    "tslib": "^2.6.3"
  },
  "devDependencies": {
    "@rollup/plugin-commonjs": "^24.1.0",
    "@rollup/plugin-node-resolve": "^15.2.3",
    "@rollup/plugin-terser": "^0.4.4",
    "@rollup/plugin-typescript": "^11.1.6",
    "@rollup/plugin-url": "^8.0.2",
    "@storybook/addon-essentials": "^8.6.12",
    "@storybook/addon-interactions": "^8.6.12",
    "@storybook/addon-onboarding": "^8.6.12",
    "@storybook/addon-webpack5-compiler-swc": "^3.0.0",
    "@storybook/blocks": "^8.6.12",
    "@storybook/react": "^8.6.12",
    "@storybook/react-webpack5": "^8.6.12",
    "@storybook/test": "^8.6.12",
    "@svgr/rollup": "^8.1.0",
    "@testing-library/jest-dom": "^5.16.5",
    "@testing-library/react": "^14.0.0",
    "@types/jest": "^29.4.0",
    "@types/react": "^18.0.28",
    "@types/react-dom": "^18.0.11",
    "autoprefixer": "^10.4.13",
    "identity-obj-proxy": "^3.0.0",
    "jest": "^29.4.3",
    "jest-environment-jsdom": "^29.4.3",
    "postcss": "^8.4.39",
    "postcss-loader": "^8.1.1",
    "rollup": "^3.17.2",
    "rollup-plugin-copy": "^3.5.0",
    "rollup-plugin-postcss": "^4.0.2",
    "storybook": "^8.6.12",
    "tailwindcss": "^3.2.7",
    "ts-jest": "^29.0.5",
    "typescript": "^4.9.5"
  },
  "peerDependencies": {
    "react": "^17.0.0 || ^18.0.0 || ^19.0.0",
    "react-dom": "^17.0.0 || ^18.0.0 || ^19.0.0"
  },
  "files": [
    "dist",
    "src/styles/*.css",
    "src/components/**/*.css",
    "fonts",
    "bin"
  ],
  "exports": {
    ".": "./dist/index.js",
    "./dist/retroui.css": "./dist/retroui.css",
    "./dist/index.css": "./dist/index.css",
    "./dist/fonts.css": "./dist/fonts.css",
    "./fonts/Minecraft.otf": "./fonts/Minecraft.otf",
    "./fonts/Minecraft-Bold.otf": "./fonts/Minecraft-Bold.otf",
    "./fonts/*": "./fonts/*"
  },
  "license": "BSD-3-Clause"
}



================================================
FILE: postcss.config.js
================================================
module.exports = {
    plugins: {
        tailwindcss: {},
        autoprefixer: {},
    },
}


================================================
FILE: rollup.config.mjs
================================================
import typescript from '@rollup/plugin-typescript';
import postcss from 'rollup-plugin-postcss';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import copy from 'rollup-plugin-copy';
import url from '@rollup/plugin-url';

export default [
    // Main bundle
    {
        input: 'src/index.ts',
        output: [
            {
                file: 'dist/index.js',
                format: 'esm',
                sourcemap: true,
                banner: "'use client';\n",
            },
        ],
        external: ['react', 'react-dom'],
        plugins: [
            typescript({
                tsconfig: './tsconfig.json',
                declaration: true,
                declarationDir: 'dist',
                exclude: ["**/*.test.tsx", "**/*.test.ts"],

            }),
            postcss({
                config: {
                    path: './postcss.config.js',
                },
                extensions: ['.css'],
                minimize: true,
                modules: {
                    generateScopedName: '[name]__[local]___[hash:base64:5]',
                },
                extract: 'index.css',
                use: ['sass'],
            }),
            url({
                include: ['**/*.otf'],
                limit: Infinity,
                fileName: '[dirname][name][extname]',
            }),
            resolve(),
            commonjs(),
            terser({
                format: {
                    comments: /^\s*('use client'|"use client");/,
                },
                compress: {
                    directives: false,
                },
            }),
            copy({
                targets: [
                    { src: 'fonts/*', dest: 'dist/fonts' }
                ]
            })
        ],
    },

    // Font-only CSS bundle
    {
        input: 'src/fonts-entry.js', // We'll create this file
        output: {
            file: 'dist/fonts.js',
            format: 'esm',
        },
        plugins: [
            postcss({
                include: ['src/fonts.css'],
                extract: 'fonts.css',
                minimize: true,
            }),
            copy({
                targets: [
                    { src: 'fonts/*', dest: 'dist/fonts' }
                ]
            })
        ]
    }
];


================================================
FILE: tailwind.config.js
================================================
module.exports = {
    content: [
        './src/**/*.{js,jsx,ts,tsx}',
        './src/**/*.css',
    ],
    theme: {
        extend: {
            fontFamily: {
                minecraft: ['Minecraft', 'sans-serif'],
            },
            colors: {
                primary: {
                    bg: 'var(--primary-bg-color, #c381b5)',
                    text: 'var(--primary-text-color, #fefcd0)',
                    shadow: 'var(--primary-box-shadow, #fefcd0)',
                },
                secondary: {
                    bg: 'var(--secondary-bg-color, #fefcd0)',
                    text: 'var(--secondary-text-color, #000000)',
                    shadow: 'var(--secondary-box-shadow, #c381b5)',
                },
                outline: {
                    text: 'var(--outline-text-color, #000000)',
                },
            },
        },
    },
    plugins: [],
}


================================================
FILE: tsconfig.json
================================================
{
  "compilerOptions": {
    "target": "es5",
    "module": "esnext",
    "lib": ["dom", "esnext"],
    "jsx": "react",
    "declaration": true,
    "declarationDir": "dist",
    "strict": true,
    "moduleResolution": "node",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "dist",
    "importHelpers": true,
    "typeRoots": ["./node_modules/@types", "./src/types"]
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}



================================================
FILE: fonts/Minecraft-Bold.otf
================================================
[Binary file]


================================================
FILE: fonts/Minecraft.otf
================================================
[Binary file]


================================================
FILE: src/fonts-entry.js
================================================
import './fonts.css';



================================================
FILE: src/fonts.css
================================================
@font-face {
  font-family: "Minecraft";
  src: url("../fonts/Minecraft.otf") format("opentype");
  font-weight: normal;
  font-style: normal;
}

@font-face {
  font-family: "Minecraft";
  src: url("../fonts/Minecraft-Bold.otf") format("opentype");
  font-weight: bold;
  font-style: normal;
}



================================================
FILE: src/index.ts
================================================
export * from "./components";
export * from "./styles";



================================================
FILE: src/retroui.css
================================================
:root {
  --primary-bg: theme("colors.primary.bg");
  --primary-text: theme("colors.primary.text");
  --primary-shadow: theme("colors.primary.shadow");
  --secondary-bg: theme("colors.secondary.bg");
  --secondary-text: theme("colors.secondary.text");
  --secondary-shadow: theme("colors.secondary.shadow");
  --outline-text: theme("colors.outline.text");
  --card-text-color: theme("colors.outline.text");
  --primary-bg-dropdown: white;
}

body {
  font-family: "Minecraft", sans-serif;
}



================================================
FILE: src/setup.ts
================================================
import "@testing-library/jest-dom";



================================================
FILE: src/components/index.ts
================================================
export * from "./Button/Button";
export * from "./Card/Card";
export * from "./Dropdown/Dropdown";
export * from "./ProgressBar/ProgressBar";
export * from "./Popup/Popup";
export * from "./Input/Input";
export * from "./TextArea/TextArea";
export * from "./Accordion/Accordion";
export * from "./Bubble/Bubble";



================================================
FILE: src/components/Accordion/Accordion.module.css
================================================
.accordion {
  @apply w-full font-minecraft text-base;
}

.accordionItem {
  @apply mb-5 border-solid border-[5px] overflow-hidden;
  background-color: var(
    --accordion-item-custom-bg,
    var(--accordion-custom-bg, var(--bg-accordion, white))
  );
  color: var(
    --accordion-item-custom-text,
    var(--accordion-custom-text, var(--text-accordion, black))
  );
  border-image-slice: 3;
  border-image-width: 2;
  border-image-repeat: stretch;
  border-image-outset: 2;
  box-shadow: 2px 2px 0 2px
      var(
        --accordion-item-custom-shadow,
        var(--accordion-custom-shadow, var(--shadow-accordion, #000000))
      ),
    -2px -2px 0 2px
      var(
        --accordion-item-custom-bg,
        var(--accordion-custom-bg, var(--bg-accordion, white))
      );
}

.accordionTrigger {
  @apply w-full flex gap-4 items-center px-4 py-1 text-left cursor-pointer;
  background-color: var(
    --accordion-item-custom-bg,
    var(--accordion-custom-bg, var(--bg-accordion, white))
  );
  color: var(
    --accordion-item-custom-text,
    var(--accordion-custom-text, var(--text-accordion, black))
  );
}

.accordionArrow {
  @apply w-6 h-6 transition-transform duration-300 ease-in-out;
  mask-repeat: no-repeat;
  mask-position: center;
  mask-size: contain;
  -webkit-mask-repeat: no-repeat;
  -webkit-mask-position: center;
  -webkit-mask-size: contain;
}

.accordionContent {
  @apply transition-all duration-300 ease-in-out overflow-hidden;
  background-color: var(
    --accordion-item-custom-bg,
    var(--accordion-custom-bg, var(--bg-accordion, white))
  );
  color: var(
    --accordion-item-custom-text,
    var(--accordion-custom-text, var(--text-accordion, black))
  );
}

.accordionContentInner {
  @apply p-4 text-sm border-t border-gray-200;
}



================================================
FILE: src/components/Accordion/Accordion.stories.tsx
================================================
import React, { ReactNode } from "react";
import { Meta, StoryFn } from "@storybook/react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "./Accordion";
// We're using global CSS styling in Storybook instead of the CSS module

// Define the meta object
const meta = {
  title: "Components/Accordion",
  component: Accordion,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    bg: { control: "color" },
    textColor: { control: "color" },
    borderColor: { control: "color" },
    shadowColor: { control: "color" },
    collapsible: { control: "boolean" },
  },
} satisfies Meta<typeof Accordion>;

export default meta;

// Define a template for all stories
const Template: StoryFn<typeof Accordion> = (args) => <Accordion {...args} />;

export const Default = Template.bind({});
Default.args = {
  collapsible: true,
  children: (
    <>
      <AccordionItem value="item-1">
        <AccordionTrigger>First Item</AccordionTrigger>
        <AccordionContent>
          <p>This is the content for the first accordion item.</p>
          <p>You can put any React components or HTML here.</p>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Second Item</AccordionTrigger>
        <AccordionContent>
          <p>This is the content for the second accordion item.</p>
          <p>The accordion can be collapsed if the collapsible prop is true.</p>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Third Item</AccordionTrigger>
        <AccordionContent>
          <p>This is the content for the third accordion item.</p>
          <p>
            You can customize colors using the bg, textColor, borderColor, and
            shadowColor props.
          </p>
        </AccordionContent>
      </AccordionItem>
    </>
  ),
};

export const CustomColors = Template.bind({});
CustomColors.args = {
  collapsible: true,
  bg: "#fefcd0",
  textColor: "black",
  borderColor: "black",
  shadowColor: "#c381b5",
  children: (
    <>
      <AccordionItem value="item-1">
        <AccordionTrigger>Retro Terminal Style</AccordionTrigger>
        <AccordionContent>
          <p>
            This accordion has a custom retro terminal style with green text on
            dark background.
          </p>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Customizable</AccordionTrigger>
        <AccordionContent>
          <p>You can customize the appearance using the color props.</p>
        </AccordionContent>
      </AccordionItem>
    </>
  ),
};

export const MultipleOpen = Template.bind({});
MultipleOpen.args = {
  collapsible: false,
  children: (
    <>
      <AccordionItem value="item-1">
        <AccordionTrigger>FAQ Item 1</AccordionTrigger>
        <AccordionContent>
          <p>With collapsible=false, multiple items can be open at once.</p>
          <p>Try clicking several headers to see them all open.</p>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>FAQ Item 2</AccordionTrigger>
        <AccordionContent>
          <p>Each item can be toggled independently.</p>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>FAQ Item 3</AccordionTrigger>
        <AccordionContent>
          <p>This mode is useful for FAQ pages or documentation.</p>
        </AccordionContent>
      </AccordionItem>
    </>
  ),
};



================================================
FILE: src/components/Accordion/Accordion.test.tsx
================================================
import React from "react";
import { render, fireEvent, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "./Accordion";

describe("Accordion", () => {
  const renderAccordion = (props = {}) => {
    return render(
      <Accordion {...props}>
        <AccordionItem value="item1">
          <AccordionTrigger>Trigger 1</AccordionTrigger>
          <AccordionContent>Content 1</AccordionContent>
        </AccordionItem>
        <AccordionItem value="item2">
          <AccordionTrigger>Trigger 2</AccordionTrigger>
          <AccordionContent>Content 2</AccordionContent>
        </AccordionItem>
      </Accordion>
    );
  };

  it("renders without crashing", () => {
    renderAccordion();
    expect(screen.getByText("Trigger 1")).toBeInTheDocument();
    expect(screen.getByText("Trigger 2")).toBeInTheDocument();
  });

  it("expands and collapses items when clicked", () => {
    renderAccordion({ collapsible: true }); // Explicitly set collapsible to true

    const trigger1 = screen.getByText("Trigger 1");
    const content1 = screen.getByText("Content 1");

    // Check initial state - should be collapsed with collapsible=true
    expect(content1).not.toBeVisible();

    fireEvent.click(trigger1);
    expect(content1).toBeVisible();

    fireEvent.click(trigger1);
    expect(content1).not.toBeVisible();
  });

  it("only allows one item to be expanded at a time by default", () => {
    renderAccordion();

    const trigger1 = screen.getByText("Trigger 1");
    const trigger2 = screen.getByText("Trigger 2");
    const content1 = screen.getByText("Content 1");
    const content2 = screen.getByText("Content 2");

    fireEvent.click(trigger1);
    expect(content1).toBeVisible();
    expect(content2).not.toBeVisible();

    fireEvent.click(trigger2);
    expect(content1).not.toBeVisible();
    expect(content2).toBeVisible();
  });

  it("applies custom styles when provided", () => {
    const { container } = renderAccordion({
      bg: "red",
      textColor: "white",
      borderColor: "blue",
      shadowColor: "green",
    });

    const accordion = container.firstChild as HTMLElement;
    expect(accordion).toHaveStyle({
      "--accordion-custom-bg": "red",
      "--accordion-custom-text": "white",
      "--accordion-custom-border": "blue",
      "--accordion-custom-shadow": "green",
    });
  });

  it("applies custom class when provided", () => {
    const { container } = renderAccordion({ className: "custom-class" });
    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("renders arrow icon and rotates it when item is active", () => {
    renderAccordion({ collapsible: true }); // Set collapsible to true

    const trigger1 = screen.getByText("Trigger 1");
    const arrow = trigger1.querySelector(".accordionArrow") as HTMLElement;

    // All items should start collapsed with collapsible=true
    expect(arrow).toHaveStyle("transform: rotate(0deg)");

    fireEvent.click(trigger1);
    expect(arrow).toHaveStyle("transform: rotate(90deg)");
  });

  it("allows all items to be collapsed when collapsible is true", () => {
    renderAccordion({ collapsible: true });

    const trigger1 = screen.getByText("Trigger 1");
    const trigger2 = screen.getByText("Trigger 2");
    const content1 = screen.getByText("Content 1");
    const content2 = screen.getByText("Content 2");

    fireEvent.click(trigger1);
    expect(content1).toBeVisible();
    expect(content2).not.toBeVisible();

    fireEvent.click(trigger1);
    expect(content1).not.toBeVisible();
    expect(content2).not.toBeVisible();

    fireEvent.click(trigger2);
    expect(content1).not.toBeVisible();
    expect(content2).toBeVisible();

    fireEvent.click(trigger2);
    expect(content1).not.toBeVisible();
    expect(content2).not.toBeVisible();
  });

  it("allows independent toggling of items when collapsible is false", () => {
    renderAccordion({ collapsible: false });

    const trigger1 = screen.getByText("Trigger 1");
    const trigger2 = screen.getByText("Trigger 2");
    const content1 = screen.getByText("Content 1");
    const content2 = screen.getByText("Content 2");

    // Initially no items are visible
    expect(content1).not.toBeVisible();
    expect(content2).not.toBeVisible();

    // Click first item to open it
    fireEvent.click(trigger1);
    expect(content1).toBeVisible();
    expect(content2).not.toBeVisible();

    // Click first item again - it should close with the new behavior
    fireEvent.click(trigger1);
    expect(content1).not.toBeVisible();
    expect(content2).not.toBeVisible();

    // Open both items
    fireEvent.click(trigger1);
    fireEvent.click(trigger2);
    expect(content1).toBeVisible();
    expect(content2).toBeVisible();
  });

  it("sets aria-expanded attribute correctly", () => {
    renderAccordion({ collapsible: true }); // Set collapsible to true

    const trigger1 = screen.getByText("Trigger 1");
    const trigger2 = screen.getByText("Trigger 2");

    // All items should start with aria-expanded="false"
    expect(trigger1).toHaveAttribute("aria-expanded", "false");
    expect(trigger2).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(trigger1);
    expect(trigger1).toHaveAttribute("aria-expanded", "true");
    expect(trigger2).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(trigger2);
    expect(trigger1).toHaveAttribute("aria-expanded", "false");
    expect(trigger2).toHaveAttribute("aria-expanded", "true");
  });

  it("allows multiple items to be expanded when collapsible is false", () => {
    renderAccordion({ collapsible: false });

    const trigger1 = screen.getByText("Trigger 1");
    const trigger2 = screen.getByText("Trigger 2");
    const content1 = screen.getByText("Content 1");
    const content2 = screen.getByText("Content 2");

    // Initially no items are visible
    expect(content1).not.toBeVisible();
    expect(content2).not.toBeVisible();

    // Click first item
    fireEvent.click(trigger1);
    expect(content1).toBeVisible();
    expect(content2).not.toBeVisible();

    // Click second item - both should be visible
    fireEvent.click(trigger2);
    expect(content1).toBeVisible();
    expect(content2).toBeVisible();

    // Click first item again - it should close
    fireEvent.click(trigger1);
    expect(content1).not.toBeVisible();
    expect(content2).toBeVisible();
  });
});



================================================
FILE: src/components/Accordion/Accordion.tsx
================================================
import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  CSSProperties,
} from "react";
import styles from "./Accordion.module.css";

interface AccordionContextType {
  activeItem: string | null;
  activeItems: string[];
  setActiveItem: React.Dispatch<React.SetStateAction<string | null>>;
  setActiveItems: React.Dispatch<React.SetStateAction<string[]>>;
  bg?: string;
  textColor?: string;
  borderColor?: string;
  shadowColor?: string;
  collapsible: boolean;
}

const AccordionContext = createContext<AccordionContextType | null>(null);

export interface AccordionProps {
  children: React.ReactNode;
  collapsible?: boolean;
  className?: string;
  bg?: string;
  textColor?: string;
  borderColor?: string;
  shadowColor?: string;
  style?: CSSProperties;
}

export const Accordion = ({
  children,
  collapsible = true,
  className = "",
  bg,
  textColor,
  borderColor,
  shadowColor,
  style,
  ...props
}: AccordionProps): JSX.Element => {
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const [activeItems, setActiveItems] = useState<string[]>([]);

  const customStyle = {
    ...style,
    "--accordion-custom-bg": bg,
    "--accordion-custom-text": textColor,
    "--accordion-custom-border": borderColor,
    "--accordion-custom-shadow": shadowColor,
  } as CSSProperties;

  return (
    <AccordionContext.Provider
      value={{
        activeItem: collapsible ? activeItem : null,
        activeItems: collapsible ? [] : activeItems,
        setActiveItem: collapsible ? setActiveItem : () => {},
        setActiveItems: collapsible ? () => {} : setActiveItems,
        bg,
        textColor,
        borderColor,
        shadowColor,
        collapsible,
      }}
    >
      <div
        className={`${styles.accordion} ${className}`}
        style={customStyle}
        {...props}
      >
        {children}
      </div>
    </AccordionContext.Provider>
  );
};

export interface AccordionItemProps {
  children: React.ReactNode;
  value: string;
  bg?: string;
  textColor?: string;
  borderColor?: string;
  shadowColor?: string;
}

const AccordionItemContext = createContext<{ value: string }>({ value: "" });

export const AccordionItem: React.FC<AccordionItemProps> = ({
  children,
  value,
  bg,
  textColor,
  borderColor,
  shadowColor,
}) => {
  const context = useContext(AccordionContext);
  const isActive = context?.collapsible
    ? context.activeItem === value
    : context?.activeItems.includes(value);

  const borderSvg = useMemo(() => {
    const color = borderColor || context?.borderColor || "currentColor";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><path d="M3 1h1v1h-1zM4 1h1v1h-1zM2 2h1v1h-1zM5 2h1v1h-1zM1 3h1v1h-1zM6 3h1v1h-1zM1 4h1v1h-1zM6 4h1v1h-1zM2 5h1v1h-1zM5 5h1v1h-1zM3 6h1v1h-1zM4 6h1v1h-1z" fill="${color}"/></svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  }, [borderColor, context?.borderColor]);

  const customStyle = {
    "--accordion-item-custom-bg": bg || context?.bg,
    "--accordion-item-custom-text": textColor || context?.textColor,
    "--accordion-item-custom-border": borderColor || context?.borderColor,
    "--accordion-item-custom-shadow": shadowColor || context?.shadowColor,
    borderImageSource: borderSvg,
  } as CSSProperties;

  return (
    <AccordionItemContext.Provider value={{ value }}>
      <div
        className={`${styles.accordionItem} ${isActive ? styles.active : ""}`}
        style={customStyle}
      >
        {children}
      </div>
    </AccordionItemContext.Provider>
  );
};

export interface AccordionTriggerProps {
  children: React.ReactNode;
}

export const AccordionTrigger: React.FC<AccordionTriggerProps> = ({
  children,
}) => {
  const context = useContext(AccordionContext);
  const item = useContext(AccordionItemContext);

  const isActive = context?.collapsible
    ? context.activeItem === item.value
    : context?.activeItems.includes(item.value);

  const handleClick = () => {
    if (!context) return;

    if (context.collapsible) {
      // Single item mode - only one can be open
      context.setActiveItem((prev) =>
        prev === item.value ? null : item.value
      );
    } else {
      // Multiple items mode
      context.setActiveItems((prev) => {
        if (prev.includes(item.value)) {
          // Remove this item
          return prev.filter((i) => i !== item.value);
        } else {
          // Add this item
          return [...prev, item.value];
        }
      });
    }
  };

  const arrowSvg = useMemo(() => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><path d="M127 21h44v43h43v42h43v43h42v43h43v42h42v44h-42v43h-43v42h-42v43h-43v42h-43v43h-44z" fill="currentColor" /></svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  }, []);

  return (
    <button
      className={styles.accordionTrigger}
      onClick={handleClick}
      aria-expanded={isActive ? "true" : "false"}
    >
      <div
        className={styles.accordionArrow}
        style={{
          transform: isActive ? "rotate(90deg)" : "rotate(0deg)",
          maskImage: arrowSvg,
          WebkitMaskImage: arrowSvg,
          backgroundColor: "currentColor",
        }}
      />
      {children}
    </button>
  );
};

export interface AccordionContentProps {
  children: React.ReactNode;
}

export const AccordionContent: React.FC<AccordionContentProps> = ({
  children,
}) => {
  const context = useContext(AccordionContext);
  const item = useContext(AccordionItemContext);

  const isActive = context?.collapsible
    ? context.activeItem === item.value
    : context?.activeItems.includes(item.value);

  return (
    <div
      className={`${styles.accordionContent} ${isActive ? styles.active : ""}`}
      style={{
        maxHeight: isActive ? "1000px" : "0",
        opacity: isActive ? 1 : 0,
      }}
    >
      <div className={styles.accordionContentInner}>{children}</div>
    </div>
  );
};

export default Accordion;



================================================
FILE: src/components/Bubble/Bubble.module.css
================================================
.balloon {
  border-radius: 4px;
  position: relative;
  display: inline-block;
  padding: 1rem 1.5rem;
  margin: 8px;
  margin-bottom: 30px;
  background-color: var(--bubble-bg-color, #ffffff);
  color: var(--bubble-text-color, #000000);
  cursor: pointer;
}

.balloon > :last-child {
  margin-bottom: 0;
}

.balloon::before,
.balloon::after {
  position: absolute;
  content: "";
}

.balloon.from-left::before,
.balloon.from-left::after {
  left: 2rem;
}

.balloon.from-left::before {
  bottom: -14px;
  width: 26px;
  height: 10px;
  background-color: var(--bubble-bg-color, #ffffff);
  border-right: 4px solid var(--bubble-border-color, #000000);
  border-left: 4px solid var(--bubble-border-color, #000000);
}

.balloon.from-left::after {
  bottom: -18px;
  width: 18px;
  height: 4px;
  margin-right: 8px;
  background-color: var(--bubble-bg-color, #ffffff);
  box-shadow: -4px 0 var(--bubble-border-color, #000000),
    4px 0 var(--bubble-border-color, #000000),
    -4px 4px var(--bubble-bg-color, #ffffff),
    0 4px var(--bubble-border-color, #000000),
    -8px 4px var(--bubble-border-color, #000000),
    -4px 8px var(--bubble-border-color, #000000),
    -8px 8px var(--bubble-border-color, #000000);
}

.balloon.from-right::before,
.balloon.from-right::after {
  right: 2rem;
}

.balloon.from-right::before {
  bottom: -14px;
  width: 26px;
  height: 10px;
  background-color: var(--bubble-bg-color, #ffffff);
  border-right: 4px solid var(--bubble-border-color, #000000);
  border-left: 4px solid var(--bubble-border-color, #000000);
}

.balloon.from-right::after {
  bottom: -18px;
  width: 18px;
  height: 4px;
  margin-left: 8px;
  background-color: var(--bubble-bg-color, #ffffff);
  box-shadow: -4px 0 var(--bubble-border-color, #000000),
    4px 0 var(--bubble-border-color, #000000),
    4px 4px var(--bubble-bg-color, #ffffff),
    0 4px var(--bubble-border-color, #000000),
    8px 4px var(--bubble-border-color, #000000),
    4px 8px var(--bubble-border-color, #000000),
    8px 8px var(--bubble-border-color, #000000);
}

.roundedCorners {
  border-style: solid;
  border-width: 4px;
  border-image-slice: 3;
  border-image-width: 3;
  border-image-repeat: stretch;
  border-image-source: var(--bubble-border-image);
  border-image-outset: 2;
}



================================================
FILE: src/components/Bubble/Bubble.stories.tsx
================================================
import React from "react";
import { Meta, StoryFn } from "@storybook/react";
import { Bubble } from "./Bubble";

const meta = {
  title: "Components/Bubble",
  component: Bubble,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    direction: {
      control: { type: "radio" },
      options: ["left", "right"],
      description: "Direction of the speech bubble tail",
    },
    borderColor: {
      control: "color",
      description: "Border color of the bubble",
    },
    bg: { control: "color", description: "Background color of the bubble" },
    textColor: {
      control: "color",
      description: "Text color inside the bubble",
    },
    onClick: { action: "clicked" },
  },
} satisfies Meta<typeof Bubble>;

export default meta;

// Template for all Bubble stories
const Template: StoryFn<typeof Bubble> = (args) => (
  <div style={{ width: "300px", height: "200px" }}>
    <Bubble {...args} />
  </div>
);

export const LeftDirection = Template.bind({});
LeftDirection.args = {
  children: "This is a speech bubble pointing to the left",
  direction: "left",
};

export const RightDirection = Template.bind({});
RightDirection.args = {
  children: "This is a speech bubble pointing to the right",
  direction: "right",
};

export const CustomColors = Template.bind({});
CustomColors.args = {
  children: "Custom colored speech bubble",
  direction: "left",
  bg: "#ddceb4",
  textColor: "#30210b",
  borderColor: "#30210b",
};

export const WithHTML = Template.bind({});
WithHTML.args = {
  children: (
    <>
      <h3 style={{ fontWeight: "bold", marginBottom: "0.5rem" }}>
        Speech Bubble Title
      </h3>
      <p>You can add any React components inside the bubble.</p>
    </>
  ),
  direction: "right",
};



================================================
FILE: src/components/Bubble/Bubble.test.tsx
================================================
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import Bubble from "./Bubble";

describe("Bubble Component", () => {
  test("renders children content", () => {
    render(<Bubble direction="left">Test Content</Bubble>);
    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  test("applies correct direction class", () => {
    const { container } = render(<Bubble direction="right">Test</Bubble>);
    expect(container.firstChild).toHaveClass("from-right");
  });

  test("applies custom styles", () => {
    const { container } = render(
      <Bubble
        direction="left"
        borderColor="#ff0000"
        bg="#00ff00"
        textColor="#0000ff"
      >
        Test
      </Bubble>
    );
    const bubbleElement = container.firstChild as HTMLElement;
    expect(bubbleElement).toHaveStyle({
      "--bubble-border-color": "#ff0000",
      "--bubble-bg-color": "#00ff00",
      "--bubble-text-color": "#0000ff",
    });
  });

  test("calls onClick when clicked", () => {
    const handleClick = jest.fn();
    render(
      <Bubble direction="left" onClick={handleClick}>
        Click me
      </Bubble>
    );
    fireEvent.click(screen.getByText("Click me"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});



================================================
FILE: src/components/Bubble/Bubble.tsx
================================================
import React, { FC, ReactNode, useMemo } from "react";
import styles from "./Bubble.module.css";

export interface BubbleProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  direction: "left" | "right";
  borderColor?: string;
  bg?: string;
  textColor?: string;
}

export const Bubble = ({
  children,
  className = "",
  onClick,
  direction,
  borderColor = "#000000",
  bg = "#ffffff",
  textColor = "#000000",
}: BubbleProps): JSX.Element => {
  const svgString = useMemo(() => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8"><path d="M3 1 h1 v1 h-1 z M4 1 h1 v1 h-1 z M2 2 h1 v1 h-1 z M5 2 h1 v1 h-1 z M1 3 h1 v1 h-1 z M6 3 h1 v1 h-1 z M1 4 h1 v1 h-1 z M6 4 h1 v1 h-1 z M2 5 h1 v1 h-1 z M5 5 h1 v1 h-1 z M3 6 h1 v1 h-1 z M4 6 h1 v1 h-1 z" fill="${borderColor}" /></svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  }, [borderColor]);

  const customStyle = {
    "--bubble-border-color": borderColor,
    "--bubble-bg-color": bg,
    "--bubble-text-color": textColor,
    "--bubble-border-image": svgString,
  } as React.CSSProperties;

  return (
    <div
      onClick={onClick}
      className={`${styles.balloon} ${styles[`from-${direction}`]} ${
        styles.roundedCorners
      } ${className}`}
      style={customStyle}
    >
      {children}
    </div>
  );
};

export default Bubble;

export { styles as BubbleStyles };



================================================
FILE: src/components/Button/Button.module.css
================================================
.pixelButton {
  @apply relative inline-block border-solid border-[5px] px-2 py-2 mx-3 my-2 font-minecraft;
  background-color: var(--button-custom-bg, var(--bg-button, #f0f0f0));
  color: var(--button-custom-text, var(--text-button, #000000));
  box-shadow: 2px 2px 0 2px
      var(--button-custom-shadow, var(--shadow-button, #000000)),
    -2px -2px 0 2px var(--button-custom-bg, var(--bg-button, #f0f0f0));
  border-image-slice: 3;
  border-image-width: 2;
  border-image-repeat: stretch;
  border-image-outset: 2;
  border-color: var(--button-custom-border, var(--border-button, #000000));
}

.pixelButton:active {
  transform: translateY(2px);
  box-shadow: 2px 2px 0 2px var(--button-custom-bg, var(--bg-button, #f0f0f0)),
    -2px -2px 0 2px var(--button-custom-bg, var(--bg-button, #f0f0f0));
}



================================================
FILE: src/components/Button/Button.stories.tsx
================================================
import React from "react";
import { Meta, StoryFn } from "@storybook/react";
import { Button } from "./Button";

// Import the button CSS in preview.ts

const meta = {
  title: "Components/Button",
  component: Button,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    bg: { control: "color" },
    textColor: { control: "color" },
    shadow: { control: "color" },
    borderColor: { control: "color" },
    onClick: { action: "clicked" },
  },
} satisfies Meta<typeof Button>;

export default meta;

// Template for all button stories
const Template: StoryFn<typeof Button> = (args) => <Button {...args} />;

export const Default = Template.bind({});
Default.args = {
  children: "Default Button",
  className: "!p-0",
};

export const Coloured = Template.bind({});
Coloured.args = {
  children: "Coloured Button",
  bg: "#fefcd0",
  textColor: "black",
  borderColor: "black",
  shadow: "#c381b5",
  className: "!p-0",
};



================================================
FILE: src/components/Button/Button.test.tsx
================================================
import React from "react";
import { render, screen } from "@testing-library/react";
import { Button } from "./Button";

describe("Button", () => {
  it("renders with default props", () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole("button", { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("pixelButton");
  });

  it("applies custom className", () => {
    render(<Button className="custom-class">Click me</Button>);
    const button = screen.getByRole("button", { name: /click me/i });
    expect(button).toHaveClass("custom-class");
  });

  it("applies custom background color", () => {
    render(<Button bg="#ff0000">Click me</Button>);
    const button = screen.getByRole("button", { name: /click me/i });
    expect(button).toHaveStyle("--button-custom-bg: #ff0000");
  });

  it("applies custom text color", () => {
    render(<Button textColor="#00ff00">Click me</Button>);
    const button = screen.getByRole("button", { name: /click me/i });
    expect(button).toHaveStyle("--button-custom-text: #00ff00");
  });

  it("applies custom shadow color", () => {
    render(<Button shadow="#0000ff">Click me</Button>);
    const button = screen.getByRole("button", { name: /click me/i });
    expect(button).toHaveStyle("--button-custom-shadow: #0000ff");
  });

  it("applies custom border color", () => {
    render(<Button borderColor="#ffff00">Click me</Button>);
    const button = screen.getByRole("button", { name: /click me/i });
    expect(button).toHaveStyle("--button-custom-border: #ffff00");
  });

  it("applies multiple custom styles", () => {
    render(
      <Button
        bg="#ff0000"
        textColor="#00ff00"
        shadow="#0000ff"
        borderColor="#ffff00"
      >
        Click me
      </Button>
    );
    const button = screen.getByRole("button", { name: /click me/i });
    expect(button).toHaveStyle({
      "--button-custom-bg": "#ff0000",
      "--button-custom-text": "#00ff00",
      "--button-custom-shadow": "#0000ff",
      "--button-custom-border": "#ffff00",
    });
  });
});



================================================
FILE: src/components/Button/Button.tsx
================================================
import React, { useMemo } from "react";
import styles from "./Button.module.css";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  bg?: string;
  textColor?: string;
  shadow?: string;
  borderColor?: string;
}

export const Button = ({
  children,
  className = "",
  bg,
  textColor,
  shadow,
  borderColor,
  style,
  ...props
}: ButtonProps): JSX.Element => {
  const svgString = useMemo(() => {
    const color = borderColor || "currentColor";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><path d="M3 1h1v1h-1zM4 1h1v1h-1zM2 2h1v1h-1zM5 2h1v1h-1zM1 3h1v1h-1zM6 3h1v1h-1zM1 4h1v1h-1zM6 4h1v1h-1zM2 5h1v1h-1zM5 5h1v1h-1zM3 6h1v1h-1zM4 6h1v1h-1z" fill="${color}"/></svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  }, [borderColor]);

  const customStyle = {
    ...style,
    "--button-custom-bg": bg,
    "--button-custom-text": textColor,
    "--button-custom-shadow": shadow,
    "--button-custom-border": borderColor,
    borderImageSource: svgString,
  };

  return (
    <button
      className={`${styles.pixelButton} ${className} p-0`}
      style={customStyle}
      {...props}
    >
      {children}
    </button>
  );
};

export { styles as ButtonStyles };



================================================
FILE: src/components/Card/Card.module.css
================================================
.pixelCard {
  @apply m-2 border-solid border-[5px] font-minecraft text-base p-4;
  background-color: var(--card-custom-bg, var(--bg-card, white));
  color: var(--card-custom-text, var(--text-card, black));
  padding: 1px;
  border-image-slice: 3;
  border-image-width: 2;
  border-image-repeat: stretch;
  border-image-outset: 2;
  box-shadow: 2px 2px 0 2px
      var(--card-custom-shadow, var(--shadow-card, #000000)),
    -2px -2px 0 2px var(--card-custom-bg, var(--bg-card, white));
  border-color: var(--card-custom-border, var(--border-card, #000000));
}



================================================
FILE: src/components/Card/Card.stories.tsx
================================================
import React from "react";
import { Meta, StoryFn } from "@storybook/react";
import { Card } from "./Card";

const meta = {
  title: "Components/Card",
  component: Card,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    bg: { control: "color" },
    textColor: { control: "color" },
    borderColor: { control: "color" },
    shadowColor: { control: "color" },
  },
} satisfies Meta<typeof Card>;

export default meta;

// Template for all card stories
const Template: StoryFn<typeof Card> = (args) => <Card {...args} />;

export const Default = Template.bind({});
Default.args = {
  children: (
    <div style={{ padding: "1rem" }}>
      <h3 style={{ fontWeight: "bold", marginBottom: "0.5rem" }}>Card Title</h3>
      <p>This is a default card with standard styling.</p>
    </div>
  ),
};

export const Colored = Template.bind({});
Colored.args = {
  bg: "#fefcd0",
  textColor: "black",
  borderColor: "black",
  shadowColor: "#c381b5",
  className: "p-4 text-center",
  children: (
    <div style={{ padding: "1rem" }}>
      <h3 style={{ fontWeight: "bold", marginBottom: "0.5rem" }}>
        Colored Card
      </h3>
      <p>This card has custom colors.</p>
    </div>
  ),
};

export const Complex = Template.bind({});
Complex.args = {
  children: (
    <div style={{ padding: "1rem", maxWidth: "300px" }}>
      <h3 style={{ fontWeight: "bold", marginBottom: "0.5rem" }}>
        Game Item Card
      </h3>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: "0.5rem",
        }}
      >
        <div
          style={{
            width: "50px",
            height: "50px",
            backgroundColor: "#eee",
            marginRight: "0.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          🎮
        </div>
        <div>
          <p style={{ fontWeight: "bold" }}>Pixel Sword</p>
          <p style={{ fontSize: "0.8rem" }}>Legendary Item</p>
        </div>
      </div>
      <p style={{ marginTop: "0.5rem" }}>
        A mighty sword forged in pixel fire. Deals +10 damage to digital
        enemies.
      </p>
    </div>
  ),
};



================================================
FILE: src/components/Card/Card.test.tsx
================================================
import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Card } from "./Card";

describe("Card Component", () => {
  test("renders card content correctly", () => {
    render(
      <Card>
        <h1>Card Title</h1>
        <p>Card Content</p>
      </Card>
    );

    expect(screen.getByText("Card Title")).toBeInTheDocument();
    expect(screen.getByText("Card Content")).toBeInTheDocument();
  });

  test("Card applies base classes", () => {
    render(<Card>Test Content</Card>);
    const card = screen.getByText("Test Content").closest("div");
    expect(card).toHaveClass("pixelCard");
  });

  test("Card accepts and applies additional className", () => {
    render(<Card className="extra-class">Test Content</Card>);
    const card = screen.getByText("Test Content").closest("div");
    expect(card).toHaveClass("pixelCard");
    expect(card).toHaveClass("extra-class");
  });

  test("Card applies custom styles", () => {
    render(
      <Card
        bg="#ff0000"
        textColor="#ffffff"
        borderColor="#000000"
        shadowColor="#333333"
      >
        Styled Card
      </Card>
    );
    const card = screen.getByText("Styled Card").closest("div");
    expect(card).toHaveStyle({
      "--card-custom-bg": "#ff0000",
      "--card-custom-text": "#ffffff",
      "--card-custom-border": "#000000",
      "--card-custom-shadow": "#333333",
    });
  });

  test("Card renders with default styles when no custom styles are provided", () => {
    render(<Card>Default Styled Card</Card>);
    const card = screen.getByText("Default Styled Card").closest("div");
    expect(card).not.toHaveStyle({
      "--card-custom-bg": expect.any(String),
      "--card-custom-text": expect.any(String),
      "--card-custom-border": expect.any(String),
      "--card-custom-shadow": expect.any(String),
    });
  });
});



================================================
FILE: src/components/Card/Card.tsx
================================================
import React, { FC, ReactNode, useMemo } from "react";
import styles from "./Card.module.css";

export interface CardProps {
  children: ReactNode;
  className?: string;
  bg?: string;
  textColor?: string;
  borderColor?: string;
  shadowColor?: string;
  style?: React.CSSProperties;
}

export const Card = ({
  children,
  className = "",
  bg,
  textColor,
  borderColor,
  shadowColor,
  style,
  ...props
}: CardProps): JSX.Element => {
  const svgString = useMemo(() => {
    const color = borderColor || "currentColor";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><path d="M3 1h1v1h-1zM4 1h1v1h-1zM2 2h1v1h-1zM5 2h1v1h-1zM1 3h1v1h-1zM6 3h1v1h-1zM1 4h1v1h-1zM6 4h1v1h-1zM2 5h1v1h-1zM5 5h1v1h-1zM3 6h1v1h-1zM4 6h1v1h-1z" fill="${color}"/></svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  }, [borderColor]);

  const customStyle = {
    ...style,
    "--card-custom-bg": bg,
    "--card-custom-text": textColor,
    "--card-custom-border": borderColor,
    "--card-custom-shadow": shadowColor,
    borderImageSource: svgString,
  };

  return (
    <div
      className={`${styles.pixelCard} ${className}`}
      style={customStyle}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;

export { styles as CardStyles };



================================================
FILE: src/components/Dropdown/Dropdown.module.css
================================================
.dropdownMenu {
  @apply relative inline-block font-minecraft text-base;
}

.pixelButton {
  @apply relative inline-block border-solid border-[5px] font-minecraft;
  background-color: var(
    --button-custom-bg,
    var(--dropdown-custom-bg, var(--bg-button, #f0f0f0))
  );
  color: var(
    --button-custom-text,
    var(--dropdown-custom-text, var(--text-button, #000000))
  );
  box-shadow: 2px 2px 0 2px
      var(
        --button-custom-shadow,
        var(--dropdown-custom-shadow, var(--shadow-button, #000000))
      ),
    -2px -2px 0 2px
      var(
        --button-custom-bg,
        var(--dropdown-custom-bg, var(--bg-button, #f0f0f0))
      );
  border-image-slice: 3;
  border-image-width: 2;
  border-image-repeat: stretch;
  border-image-outset: 2;
  border-color: var(
    --button-custom-border,
    var(--dropdown-custom-border, var(--border-button, #000000))
  );
}

.pixelButton:active {
  transform: translateY(2px);
  box-shadow: 2px 2px 0 2px
      var(
        --button-custom-bg,
        var(--dropdown-custom-bg, var(--bg-button, #f0f0f0))
      ),
    -2px -2px 0 2px
      var(
        --button-custom-bg,
        var(--dropdown-custom-bg, var(--bg-button, #f0f0f0))
      );
}

.dropdownMenuTrigger {
  @apply flex items-center justify-between;
}

.dropdownArrow {
  @apply w-4 h-4 transition-transform duration-300 ease-in-out ml-2;
  mask-repeat: no-repeat;
  mask-position: center;
  mask-size: contain;
  -webkit-mask-repeat: no-repeat;
  -webkit-mask-position: center;
  -webkit-mask-size: contain;
}

.dropdownMenuContent {
  @apply absolute z-10 border-solid border-[5px] left-0;
  top: calc(100% + 16px); /* Fixed 8px spacing */
  background-color: var(
    --dropdown-content-custom-bg,
    var(--dropdown-custom-bg, var(--bg-dropdown, white))
  );
  color: var(
    --dropdown-content-custom-text,
    var(--dropdown-custom-text, var(--text-dropdown, black))
  );
  border-image-slice: 3;
  border-image-width: 2;
  border-image-repeat: stretch;
  border-image-outset: 2;
  box-shadow: 2px 2px 0 2px
      var(
        --dropdown-content-custom-shadow,
        var(--dropdown-custom-shadow, var(--shadow-dropdown, #000000))
      ),
    -2px -2px 0 2px
      var(
        --dropdown-content-custom-bg,
        var(--dropdown-custom-bg, var(--bg-dropdown, white))
      );
  border-color: var(
    --dropdown-content-custom-border,
    var(--dropdown-custom-border, var(--border-dropdown, #000000))
  );
}

.dropdownMenuLabel {
  @apply font-bold;
}

.dropdownMenuItem {
  @apply cursor-pointer hover:bg-gray-100;
}

.dropdownMenuItem:hover {
  background-color: var(
    --dropdown-content-custom-bg,
    var(--dropdown-custom-bg, var(--bg-dropdown-hover, #e0e0e0))
  );
}

.dropdownMenuSeparator {
  @apply h-px bg-gray-200 my-1;
}



================================================
FILE: src/components/Dropdown/Dropdown.stories.tsx
================================================
import React from "react";
import { Meta, StoryFn } from "@storybook/react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "./Dropdown";

const meta = {
  title: "Components/Dropdown",
  component: DropdownMenu,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    bg: { control: "color" },
    textColor: { control: "color" },
    borderColor: { control: "color" },
    shadowColor: { control: "color" },
  },
} satisfies Meta<typeof DropdownMenu>;

export default meta;

// Template for all Dropdown stories
const Template: StoryFn<typeof DropdownMenu> = (args) => (
  <div style={{ padding: "2rem" }}>
    <DropdownMenu {...args}>
      <DropdownMenuTrigger>Click me</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Account</DropdownMenuLabel>
        <DropdownMenuItem>Profile</DropdownMenuItem>
        <DropdownMenuItem>Settings</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Logout</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
);

export const Default = Template.bind({});
Default.args = {};

export const CustomColors = Template.bind({});
CustomColors.args = {
  bg: "#333333",
  textColor: "#ffffff",
  borderColor: "#ff00ff",
  shadowColor: "rgba(255, 0, 255, 0.5)",
};

export const WithIcons: StoryFn<typeof DropdownMenu> = (args) => (
  <div style={{ padding: "2rem" }}>
    <DropdownMenu {...args}>
      <DropdownMenuTrigger>Options</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem>
          <span style={{ marginRight: "8px", fontSize: "12px" }}>👤</span>
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem>
          <span style={{ marginRight: "8px", fontSize: "12px" }}>⚙️</span>
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <span style={{ marginRight: "8px", fontSize: "12px" }}>🚪</span>
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
);

export const MultipleDropdowns: StoryFn<typeof DropdownMenu> = (args) => (
  <div style={{ padding: "2rem", display: "flex", gap: "1rem" }}>
    <DropdownMenu {...args}>
      <DropdownMenuTrigger>File</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>New</DropdownMenuItem>
        <DropdownMenuItem>Open</DropdownMenuItem>
        <DropdownMenuItem>Save</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Exit</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    <DropdownMenu {...args}>
      <DropdownMenuTrigger>Edit</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>Cut</DropdownMenuItem>
        <DropdownMenuItem>Copy</DropdownMenuItem>
        <DropdownMenuItem>Paste</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    <DropdownMenu {...args}>
      <DropdownMenuTrigger>Help</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>Documentation</DropdownMenuItem>
        <DropdownMenuItem>About</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
);



================================================
FILE: src/components/Dropdown/Dropdown.test.tsx
================================================
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "./Dropdown";

describe("Dropdown", () => {
  const setup = () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Item 1</DropdownMenuItem>
          <DropdownMenuItem>Item 2</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  test("renders the dropdown trigger", () => {
    setup();
    expect(screen.getByText("Open")).toBeInTheDocument();
  });

  test("opens the dropdown when trigger is clicked", () => {
    setup();
    fireEvent.click(screen.getByText("Open"));
    expect(screen.getByText("Item 1")).toBeInTheDocument();
    expect(screen.getByText("Item 2")).toBeInTheDocument();
  });

  test("closes the dropdown when clicked outside", () => {
    setup();
    fireEvent.click(screen.getByText("Open"));
    expect(screen.getByText("Item 1")).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    expect(screen.queryByText("Item 1")).not.toBeInTheDocument();
  });

  test("keeps dropdown open when clicking inside", () => {
    setup();
    fireEvent.click(screen.getByText("Open"));

    const dropdownContent = screen.getByText("Item 1").parentElement;
    if (dropdownContent) {
      fireEvent.mouseDown(dropdownContent);
    }

    expect(screen.getByText("Item 1")).toBeInTheDocument();
  });

  test("applies custom styles", () => {
    render(
      <DropdownMenu
        bg="red"
        textColor="white"
        borderColor="black"
        shadowColor="gray"
      >
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Item 1</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    const dropdown = screen.getByText("Open").closest(".dropdownMenu");
    expect(dropdown).toHaveStyle({
      "--dropdown-custom-bg": "red",
      "--dropdown-custom-text": "white",
      "--dropdown-custom-border": "black",
      "--dropdown-custom-shadow": "gray",
    });
  });
});



================================================
FILE: src/components/Dropdown/Dropdown.tsx
================================================
import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  CSSProperties,
  useCallback,
  useRef,
  useEffect,
} from "react";
import styles from "./Dropdown.module.css";

interface DropdownContextType {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  triggerWidth: number;
  setTriggerRef: (element: HTMLElement | null) => void;
}

const DropdownContext = createContext<DropdownContextType | null>(null);

export interface DropdownMenuProps {
  children: React.ReactNode;
  className?: string;
  bg?: string;
  textColor?: string;
  borderColor?: string;
  shadowColor?: string;
  style?: CSSProperties;
}

export const DropdownMenu = ({
  children,
  className = "",
  bg,
  textColor,
  borderColor,
  shadowColor,
  style,
  ...props
}: DropdownMenuProps): JSX.Element => {
  const [isOpen, setIsOpen] = useState(false);
  const [triggerWidth, setTriggerWidth] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const setTriggerRef = useCallback((element: HTMLElement | null) => {
    if (element) {
      setTriggerWidth(element.offsetWidth);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const customStyle = {
    ...style,
    "--dropdown-custom-bg": bg,
    "--dropdown-custom-text": textColor,
    "--dropdown-custom-border": borderColor,
    "--dropdown-custom-shadow": shadowColor,
  } as CSSProperties;

  return (
    <DropdownContext.Provider
      value={{
        isOpen,
        setIsOpen,
        triggerWidth,
        setTriggerRef,
      }}
    >
      <div
        ref={dropdownRef}
        className={`${styles.dropdownMenu} ${className}`}
        style={customStyle}
        {...props}
      >
        {children}
      </div>
    </DropdownContext.Provider>
  );
};

export interface DropdownMenuTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  bg?: string;
  textColor?: string;
  shadow?: string;
  borderColor?: string;
}

export const DropdownMenuTrigger = ({
  children,
  className = "",
  bg,
  textColor,
  shadow,
  borderColor,
  style,
  ...props
}: DropdownMenuTriggerProps): JSX.Element => {
  const context = useContext(DropdownContext);

  const handleClick = () => {
    if (context) {
      context.setIsOpen((prev) => !prev);
    }
  };

  const svgString = useMemo(() => {
    const color = borderColor || "currentColor";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><path d="M3 1h1v1h-1zM4 1h1v1h-1zM2 2h1v1h-1zM5 2h1v1h-1zM1 3h1v1h-1zM6 3h1v1h-1zM1 4h1v1h-1zM6 4h1v1h-1zM2 5h1v1h-1zM5 5h1v1h-1zM3 6h1v1h-1zM4 6h1v1h-1z" fill="${color}"/></svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  }, [borderColor]);

  const arrowSvg = useMemo(() => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><path d="M127 21h44v43h43v42h43v43h42v43h43v42h42v44h-42v43h-43v42h-42v43h-43v42h-43v43h-44z" fill="currentColor" /></svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  }, []);

  const customStyle = {
    ...style,
    "--button-custom-bg": bg,
    "--button-custom-text": textColor,
    "--button-custom-shadow": shadow,
    "--button-custom-border": borderColor,
    borderImageSource: svgString,
  } as CSSProperties;

  return (
    <button
      ref={context?.setTriggerRef}
      className={`${styles.pixelButton} ${styles.dropdownMenuTrigger} ${className}`}
      style={customStyle}
      onClick={handleClick}
      {...props}
    >
      {children}
      <div
        className={styles.dropdownArrow}
        style={{
          transform: context?.isOpen ? "rotate(90deg)" : "rotate(0deg)",
          maskImage: arrowSvg,
          WebkitMaskImage: arrowSvg,
          backgroundColor: "currentColor",
        }}
      />
    </button>
  );
};

export interface DropdownMenuContentProps {
  children: React.ReactNode;
  className?: string;
  bg?: string;
  textColor?: string;
  borderColor?: string;
  shadowColor?: string;
  style?: CSSProperties;
}

export const DropdownMenuContent = ({
  children,
  className = "",
  bg,
  textColor,
  borderColor,
  shadowColor,
  style,
  ...props
}: DropdownMenuContentProps): JSX.Element | null => {
  const context = useContext(DropdownContext);

  const borderSvg = useMemo(() => {
    const color = borderColor || "currentColor";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><path d="M3 1h1v1h-1zM4 1h1v1h-1zM2 2h1v1h-1zM5 2h1v1h-1zM1 3h1v1h-1zM6 3h1v1h-1zM1 4h1v1h-1zM6 4h1v1h-1zM2 5h1v1h-1zM5 5h1v1h-1zM3 6h1v1h-1zM4 6h1v1h-1z" fill="${color}"/></svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  }, [borderColor]);

  const customStyle = {
    ...style,
    "--dropdown-content-custom-bg": bg,
    "--dropdown-content-custom-text": textColor,
    "--dropdown-content-custom-border": borderColor,
    "--dropdown-content-custom-shadow": shadowColor,
    borderImageSource: borderSvg,
    minWidth: context?.triggerWidth ? `${context.triggerWidth}px` : "auto",
  } as CSSProperties;

  if (!context?.isOpen) return null;

  return (
    <div
      className={`${styles.dropdownMenuContent} ${className}`}
      style={customStyle}
      {...props}
    >
      {children}
    </div>
  );
};

export const DropdownMenuLabel = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}): JSX.Element => (
  <div className={`${styles.dropdownMenuLabel} ${className}`}>{children}</div>
);

export const DropdownMenuItem = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}): JSX.Element => (
  <div className={`${styles.dropdownMenuItem} ${className}`}>{children}</div>
);

export const DropdownMenuSeparator = ({
  className = "",
}: {
  className?: string;
}): JSX.Element => (
  <div className={`${styles.dropdownMenuSeparator} ${className}`} />
);

export default DropdownMenu;



================================================
FILE: src/components/Input/Input.module.css
================================================
.pixelContainer {
  @apply relative inline-block border-solid border-[5px];
  background-color: var(--input-custom-bg, var(--bg-input, white));
  color: var(--input-custom-text, var(--text-input, black));
  border-image-slice: 3;
  border-image-width: 2;
  border-image-repeat: stretch;
  border-image-outset: 2;
  font-size: 16px;
  box-shadow: 2px 2px 0 2px var(--input-custom-bg, var(--bg-input, white)),
    -2px -2px 0 2px var(--input-custom-bg, var(--bg-input, white));
  border-color: var(--input-custom-border, var(--border-input, black));
}

.pixelInput {
  @apply bg-transparent px-2 py-1;
  color: inherit;
}

.pixelInput:focus {
  @apply outline-none;
}

.pixelInputIconButton {
  @apply p-1 mr-1;
}

.pixelInputIconButton:active {
  @apply top-[2px];
}



================================================
FILE: src/components/Input/Input.stories.tsx
================================================
import React from "react";
import { Meta, StoryFn } from "@storybook/react";
import { Input } from "./Input";

const meta = {
  title: "Components/Input",
  component: Input,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    bg: { control: "color" },
    textColor: { control: "color" },
    borderColor: { control: "color" },
    placeholder: { control: "text" },
    disabled: { control: "boolean" },
    type: {
      control: { type: "select" },
      options: ["text", "password", "email", "number", "tel", "url"],
    },
    onChange: { action: "changed" },
    onIconClick: { action: "icon clicked" },
  },
} satisfies Meta<typeof Input>;

export default meta;

// Template for all Input stories
const Template: StoryFn<typeof Input> = (args) => (
  <div style={{ width: "300px" }}>
    <Input {...args} />
  </div>
);

export const Default = Template.bind({});
Default.args = {
  placeholder: "Enter text...",
};

export const WithValue = Template.bind({});
WithValue.args = {
  value: "Hello RetroUI",
  placeholder: "Enter text...",
};

export const Password = Template.bind({});
Password.args = {
  type: "password",
  placeholder: "Enter password...",
  value: "secretpassword",
};

export const Disabled = Template.bind({});
Disabled.args = {
  placeholder: "Disabled input",
  disabled: true,
};

export const WithIcon = Template.bind({});
WithIcon.args = {
  placeholder: "Search...",
  icon: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZD0iTTE1LjUgMTRoLS43OWwtLjI4LS4yN0MxNS40MSAxMi41OSAxNiAxMS4xMSAxNiA5LjUgMTYgNS45MSAxMy4wOSAzIDkuNSAzUzMgNS45MSAzIDkuNSA1LjkxIDE2IDkuNSAxNmMxLjYxIDAgMy4wOS0uNTkgNC4yMy0xLjU3bC4yNy4yOHYuNzlsNSA0Ljk5TDIwLjQ5IDE5bC00Ljk5LTV6bS02IDBDNy4wMSAxNCA1IDExLjk5IDUgOS41UzcuMDEgNSA5LjUgNSAxNCA3LjAxIDE0IDkuNSAxMS45OSAxNCA5LjUgMTR6Ii8+PC9zdmc+",
  onIconClick: () => alert("Search clicked"),
};

export const Colored = Template.bind({});
Colored.args = {
  placeholder: "Colored theme...",
  bg: "#FEFCD0", // light yellow
  textColor: "#000000",
  borderColor: "#C381B5", // primary purple
};



================================================
FILE: src/components/Input/Input.test.tsx
================================================
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Input } from "./Input";

describe("Input Component", () => {
  test("renders input element", () => {
    render(<Input placeholder="Test placeholder" />);
    expect(screen.getByPlaceholderText("Test placeholder")).toBeInTheDocument();
  });

  test("applies custom className", () => {
    render(<Input className="custom-class" />);
    expect(screen.getByRole("textbox").parentElement).toHaveClass(
      "custom-class"
    );
  });

  test("renders icon when provided", () => {
    render(<Input icon="/icons/search-1.svg" />);
    expect(screen.getByAltText("Input icon")).toBeInTheDocument();
  });

  test("calls onIconClick when icon is clicked", () => {
    const mockOnIconClick = jest.fn();
    render(<Input icon="/icons/search-1.svg" onIconClick={mockOnIconClick} />);
    fireEvent.click(screen.getByAltText("Input icon"));
    expect(mockOnIconClick).toHaveBeenCalledTimes(1);
  });
});



================================================
FILE: src/components/Input/Input.tsx
================================================
import React, { useMemo } from "react";
import styles from "./Input.module.css";

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "style"> {
  icon?: string;
  onIconClick?: () => void;
  bg?: string;
  textColor?: string;
  borderColor?: string;
  style?: React.CSSProperties & {
    "--input-custom-bg"?: string;
    "--input-custom-text"?: string;
    "--input-custom-border"?: string;
  };
}

export const Input = ({
  className = "",
  icon,
  onIconClick,
  bg,
  textColor,
  borderColor,
  style,
  ...props
}: InputProps): JSX.Element => {
  const svgString = useMemo(() => {
    const color = borderColor || "currentColor";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><path d="M3 1h1v1h-1zM4 1h1v1h-1zM2 2h1v1h-1zM5 2h1v1h-1zM1 3h1v1h-1zM6 3h1v1h-1zM1 4h1v1h-1zM6 4h1v1h-1zM2 5h1v1h-1zM5 5h1v1h-1zM3 6h1v1h-1zM4 6h1v1h-1z" fill="${color}"/></svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  }, [borderColor]);

  const customStyle = {
    ...style,
    "--input-custom-bg": bg,
    "--input-custom-text": textColor,
    "--input-custom-border": borderColor,
    borderImageSource: svgString,
  };

  return (
    <div
      className={`${styles.pixelContainer} relative mx-1 my-2 ${className}`}
      style={customStyle}
    >
      <input
        className={`${styles.pixelInput} w-full pr-7 font-minecraft`}
        {...props}
      />
      {icon && (
        <button
          className={`${styles.pixelInputIconButton} absolute right-0 top-0`}
          onClick={onIconClick}
          type="button"
        >
          <img src={icon} alt="Input icon" className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export default Input;

export { styles as InputStyles };



================================================
FILE: src/components/Popup/Popup.module.css
================================================
.pixelPopupOverlay {
  @apply fixed inset-0 flex justify-center items-center z-50;
  background-color: var(--popup-overlay-bg, rgba(0, 0, 0, 0.5));
}

.pixelPopup {
  @apply relative p-1;
  background-color: var(--popup-base-bg, var(--bg-popup-base, white));
  color: var(--popup-text, var(--text-popup, black));
  border-style: solid;
  border-width: 5px;
  border-image-slice: 3;
  border-image-width: 2;
  border-image-repeat: stretch;
  border-image-source: var(--popup-border-svg);
  border-image-outset: 2;
  box-shadow: 2px 2px 0 2px var(--popup-base-bg, var(--bg-popup-base, white)),
    -2px -2px 0 2px var(--popup-base-bg, var(--bg-popup-base, white));
}

.pixelPopupInner {
  @apply p-4;
  background-color: var(--popup-bg, var(--bg-popup, #f0f0f0));
  color: var(--popup-text, var(--text-popup, black));
  border-style: solid;
  border-width: 5px;
  border-image-slice: 3;
  border-image-width: 2;
  border-image-repeat: stretch;
  border-image-source: var(--popup-border-svg);
  border-image-outset: 2;
  box-shadow: 2px 2px 0 2px var(--popup-bg, var(--bg-popup, #f0f0f0)),
    -2px -2px 0 2px var(--popup-bg, var(--bg-popup, #f0f0f0));
}

.pixelPopupTitle {
  @apply text-2xl mb-4 text-center font-minecraft;
}

.pixelPopupCloseButton {
  @apply absolute top-1 right-2 bg-transparent border-none cursor-pointer text-lg font-minecraft;
  color: var(--popup-text, var(--text-popup, black));
}

.pixelPopupContent {
  @apply font-minecraft;
}



================================================
FILE: src/components/Popup/Popup.stories.tsx
================================================
import React, { useState } from "react";
import { Meta, StoryFn } from "@storybook/react";
import { Popup } from "./Popup";
import { Button } from "../Button/Button";

const meta = {
  title: "Components/Popup",
  component: Popup,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    isOpen: { control: "boolean" },
    title: { control: "text" },
    closeButtonText: { control: "text" },
    bg: { control: "color" },
    baseBg: { control: "color" },
    overlayBg: { control: "color" },
    textColor: { control: "color" },
    borderColor: { control: "color" },
    onClose: { action: "closed" },
  },
} satisfies Meta<typeof Popup>;

export default meta;

// Base Template with a trigger button
const Template: StoryFn<typeof Popup> = (args) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ padding: "2rem" }}>
      <Button onClick={() => setIsOpen(true)}>Open Popup</Button>
      <Popup {...args} isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <p>This is the content of the popup!</p>
        <p>You can put anything you want here.</p>
      </Popup>
    </div>
  );
};

export const Default = Template.bind({});
Default.args = {
  title: "Basic Popup",
};

export const Colored: StoryFn<typeof Popup> = (args) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ padding: "2rem" }}>
      <Button
        onClick={() => setIsOpen(true)}
        bg="#333333"
        textColor="#ffffff"
        borderColor="#ff00ff"
      >
        Open Colored Popup
      </Button>
      <Popup {...args} isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <p>This is the content of the popup!</p>
        <p>You can put anything you want here.</p>
      </Popup>
    </div>
  );
};
Colored.args = {
  title: "Colored Popup",
  bg: "#333333",
  textColor: "#ffffff",
  borderColor: "#ff00ff",
  overlayBg: "rgba(0, 0, 0, 0.7)",
};

export const FormPopup: StoryFn<typeof Popup> = (args) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ padding: "2rem" }}>
      <Button onClick={() => setIsOpen(true)}>Login</Button>
      <Popup {...args} isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <div style={{ padding: "1rem", minWidth: "300px" }}>
          <form onSubmit={(e) => e.preventDefault()}>
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem" }}>
                Username
              </label>
              <input
                type="text"
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  fontFamily: "Minecraft, sans-serif",
                  border: "2px solid #000",
                }}
              />
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem" }}>
                Password
              </label>
              <input
                type="password"
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  fontFamily: "Minecraft, sans-serif",
                  border: "2px solid #000",
                }}
              />
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginTop: "1rem",
              }}
            >
              <Button onClick={() => setIsOpen(false)}>Login</Button>
            </div>
          </form>
        </div>
      </Popup>
    </div>
  );
};
FormPopup.args = {
  title: "Login",
};



================================================
FILE: src/components/Popup/Popup.test.tsx
================================================
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Popup } from "./Popup";

describe("Popup Component", () => {
  const onCloseMock = jest.fn();

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("renders nothing when isOpen is false", () => {
    render(
      <Popup isOpen={false} onClose={onCloseMock}>
        <p>Test content</p>
      </Popup>
    );
    expect(screen.queryByText("Test content")).not.toBeInTheDocument();
  });

  test("renders content when isOpen is true", () => {
    render(
      <Popup isOpen={true} onClose={onCloseMock}>
        <p>Test content</p>
      </Popup>
    );
    expect(screen.getByText("Test content")).toBeInTheDocument();
  });

  test("calls onClose when clicking outside the popup", () => {
    render(
      <Popup isOpen={true} onClose={onCloseMock}>
        <p>Test content</p>
      </Popup>
    );
    fireEvent.click(
      screen.getByText("Test content").parentElement!.parentElement!
        .parentElement!.parentElement!
    );
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  test("does not call onClose when clicking inside the popup", () => {
    render(
      <Popup isOpen={true} onClose={onCloseMock}>
        <p>Test content</p>
      </Popup>
    );
    fireEvent.click(screen.getByText("Test content"));
    expect(onCloseMock).not.toHaveBeenCalled();
  });

  test("renders title when provided", () => {
    render(
      <Popup isOpen={true} onClose={onCloseMock} title="Test Title">
        <p>Test content</p>
      </Popup>
    );
    expect(screen.getByText("Test Title")).toBeInTheDocument();
  });

  test("renders custom close button text", () => {
    render(
      <Popup isOpen={true} onClose={onCloseMock} closeButtonText="Close">
        <p>Test content</p>
      </Popup>
    );
    expect(screen.getByText("Close")).toBeInTheDocument();
  });
});



================================================
FILE: src/components/Popup/Popup.tsx
================================================
import React, { useMemo } from "react";
import styles from "./Popup.module.css";

export interface PopupProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  children: React.ReactNode;
  title?: string;
  closeButtonText?: string;
  bg?: string;
  baseBg?: string;
  overlayBg?: string;
  textColor?: string;
  borderColor?: string;
}

export const Popup = ({
  isOpen,
  onClose,
  className = "",
  children,
  title,
  closeButtonText = "X",
  bg,
  baseBg,
  overlayBg,
  textColor,
  borderColor,
}: PopupProps): JSX.Element | null => {
  if (!isOpen) return null;

  const svgString = useMemo(() => {
    const color = borderColor || "currentColor";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><path d="M3 1h1v1h-1zM4 1h1v1h-1zM2 2h1v1h-1zM5 2h1v1h-1zM1 3h1v1h-1zM6 3h1v1h-1zM1 4h1v1h-1zM6 4h1v1h-1zM2 5h1v1h-1zM5 5h1v1h-1zM3 6h1v1h-1zM4 6h1v1h-1z" fill="${color}"/></svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  }, [borderColor]);

  const customStyle = {
    "--popup-bg": bg,
    "--popup-base-bg": baseBg,
    "--popup-overlay-bg": overlayBg,
    "--popup-text": textColor,
    "--popup-border": borderColor,
    "--popup-border-svg": svgString,
  } as React.CSSProperties;

  return (
    <div
      className={`${styles.pixelPopupOverlay} ${className}`}
      onClick={onClose}
      style={customStyle}
    >
      <div className={styles.pixelPopup} onClick={(e) => e.stopPropagation()}>
        <div className={styles.pixelPopupInner}>
          {title && <h2 className={styles.pixelPopupTitle}>{title}</h2>}
          <button className={styles.pixelPopupCloseButton} onClick={onClose}>
            {closeButtonText}
          </button>
          <div className={styles.pixelPopupContent}>{children}</div>
        </div>
      </div>
    </div>
  );
};

export { styles as PopupStyles };
export default Popup;



================================================
FILE: src/components/ProgressBar/ProgressBar.module.css
================================================
.pixelProgressbarContainer {
  @apply relative w-full;
  height: 30px;
  padding: 2px;
  border-style: solid;
  border-width: 5px;
  border-image-slice: 3;
  border-image-width: 2;
  border-image-repeat: stretch;
  background-color: transparent;

  border-color: var(
    --progressbar-custom-border-color,
    var(--border-progressbar, #000000)
  );
}

.pixelProgressbar {
  @apply h-full;
  opacity: 50%;
  background-color: var(
    --progressbar-custom-color,
    var(--color-progressbar, #000000)
  );
}

/* Sizes */
.pixelProgressbarSm {
  height: 20px;
}

.pixelProgressbarMd {
  height: 30px;
}

.pixelProgressbarLg {
  height: 40px;
}



================================================
FILE: src/components/ProgressBar/ProgressBar.stories.tsx
================================================
import React from "react";
import { Meta, StoryFn } from "@storybook/react";
import { ProgressBar } from "./ProgressBar";

const meta = {
  title: "Components/ProgressBar",
  component: ProgressBar,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    progress: {
      control: { type: "range", min: 0, max: 100, step: 1 },
      description: "Progress value (0-100)",
    },
    size: {
      control: { type: "radio" },
      options: ["sm", "md", "lg"],
      description: "Size of the progress bar",
    },
    color: { control: "color", description: "Color of the progress indicator" },
    borderColor: {
      control: "color",
      description: "Border color of the progress bar",
    },
  },
} satisfies Meta<typeof ProgressBar>;

export default meta;

// Template for all ProgressBar stories
const Template: StoryFn<typeof ProgressBar> = (args) => (
  <div style={{ width: "300px" }}>
    <ProgressBar {...args} />
  </div>
);

export const Default = Template.bind({});
Default.args = {
  progress: 50,
};

export const Small = Template.bind({});
Small.args = {
  progress: 35,
  size: "sm",
};

export const Medium = Template.bind({});
Medium.args = {
  progress: 50,
  size: "md",
};

export const Large = Template.bind({});
Large.args = {
  progress: 65,
  size: "lg",
};

export const CustomColors = Template.bind({});
CustomColors.args = {
  progress: 75,
  color: "#c381b5",
  borderColor: "black",
};

export const Complete = Template.bind({});
Complete.args = {
  progress: 100,
  color: "#00FF00",
};



================================================
FILE: src/components/ProgressBar/ProgressBar.test.tsx
================================================
import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ProgressBar } from "./ProgressBar";

describe("ProgressBar", () => {
  it("renders without crashing", () => {
    render(<ProgressBar progress={50} />);
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("displays the correct progress", () => {
    render(<ProgressBar progress={75} />);
    const progressBar = screen.getByRole("progressbar");
    expect(progressBar).toHaveAttribute("aria-valuenow", "75");
  });

  it("clamps progress between 0 and 100", () => {
    const { rerender } = render(<ProgressBar progress={-10} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "0"
    );

    rerender(<ProgressBar progress={110} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "100"
    );
  });

  it("applies custom className", () => {
    render(<ProgressBar progress={50} className="custom-class" />);
    expect(screen.getByRole("progressbar")).toHaveClass("custom-class");
  });

  it("applies different sizes", () => {
    const { rerender } = render(<ProgressBar progress={50} size="sm" />);
    expect(screen.getByRole("progressbar")).toHaveClass("pixelProgressbarSm");

    rerender(<ProgressBar progress={50} size="md" />);
    expect(screen.getByRole("progressbar")).toHaveClass("pixelProgressbarMd");

    rerender(<ProgressBar progress={50} size="lg" />);
    expect(screen.getByRole("progressbar")).toHaveClass("pixelProgressbarLg");
  });

  it("applies custom color", () => {
    render(<ProgressBar progress={50} color="red" />);
    const progressBar = screen.getByRole("progressbar");
    expect(progressBar).toHaveStyle("--progressbar-custom-color: red");
  });

  it("applies custom border color", () => {
    render(<ProgressBar progress={50} borderColor="blue" />);
    const progressBar = screen.getByRole("progressbar");
    expect(progressBar).toHaveStyle("--progressbar-custom-border-color: blue");
  });

  it("generates correct SVG string for border", () => {
    render(<ProgressBar progress={50} borderColor="blue" />);
    const progressBar = screen.getByRole("progressbar");
    const style = window.getComputedStyle(progressBar);
    const borderImageSource = style.getPropertyValue("border-image-source");
    expect(borderImageSource).toContain("data:image/svg+xml,");
    expect(borderImageSource).toContain("fill%3D%22blue%22");
  });
});



================================================
FILE: src/components/ProgressBar/ProgressBar.tsx
================================================
import React, { useMemo } from "react";
import styles from "./ProgressBar.module.css";

export interface ProgressBarProps {
  progress: number;
  className?: string;
  size?: "sm" | "md" | "lg";
  color?: string;
  borderColor?: string;
}

export const ProgressBar = ({
  progress,
  className = "",
  size = "md",
  color,
  borderColor,
}: ProgressBarProps): JSX.Element => {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  const svgString = useMemo(() => {
    const svgColor = borderColor || "currentColor";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><path d="M3 1h1v1h-1zM4 1h1v1h-1zM2 2h1v1h-1zM5 2h1v1h-1zM1 3h1v1h-1zM6 3h1v1h-1zM1 4h1v1h-1zM6 4h1v1h-1zM2 5h1v1h-1zM5 5h1v1h-1zM3 6h1v1h-1zM4 6h1v1h-1z" fill="${svgColor}"/></svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  }, [borderColor]);

  const containerClasses = `${styles.pixelProgressbarContainer} ${
    styles[`pixelProgressbar${size.charAt(0).toUpperCase() + size.slice(1)}`]
  } ${className}`.trim();

  const customStyle = {
    "--progressbar-custom-color": color,
    "--progressbar-custom-border-color": borderColor,
    borderImageSource: svgString,
  } as React.CSSProperties;

  return (
    <div
      className={containerClasses}
      style={customStyle}
      role="progressbar"
      aria-valuenow={clampedProgress}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={styles.pixelProgressbar}
        style={{ width: `${clampedProgress}%` }}
      ></div>
    </div>
  );
};

export { styles as ProgressBarStyles };
export default ProgressBar;



================================================
FILE: src/components/TextArea/TextArea.module.css
================================================
.pixelTextarea {
  @apply w-full p-2 text-base min-h-[100px] resize outline-none;
  background-color: var(--textarea-custom-bg, var(--bg-textarea, #f0f0f0));
  color: var(--textarea-custom-text, var(--text-textarea, #000000));
  border-style: solid;
  box-shadow: 2px 2px 0 2px
      var(--textarea-custom-bg, var(--bg-textarea, #f0f0f0)),
    -2px -2px 0 2px var(--textarea-custom-bg, var(--bg-textarea, #f0f0f0));
  border-width: 5px;
  border-image-slice: 3;
  border-image-width: 2;
  border-image-repeat: stretch;
  border-image-outset: 2;
  border-color: var(--textarea-custom-border, var(--border-textarea, #000000));
}

.pixelTextarea:focus {
  @apply outline-none;
}



================================================
FILE: src/components/TextArea/TextArea.stories.tsx
================================================
import React from "react";
import { Meta, StoryFn } from "@storybook/react";
import { TextArea } from "./TextArea";

const meta = {
  title: "Components/TextArea",
  component: TextArea,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    bg: { control: "color" },
    textColor: { control: "color" },
    borderColor: { control: "color" },
    placeholder: { control: "text" },
    disabled: { control: "boolean" },
    value: { control: "text" },
    rows: { control: "number" },
    onChange: { action: "changed" },
  },
} satisfies Meta<typeof TextArea>;

export default meta;

// Template for all TextArea stories
const Template: StoryFn<typeof TextArea> = (args) => (
  <div style={{ width: "400px" }}>
    <TextArea {...args} />
  </div>
);

export const Default = Template.bind({});
Default.args = {
  placeholder: "Enter your text here...",
  rows: 4,
};

export const WithValue = Template.bind({});
WithValue.args = {
  value:
    "This is a retro-style textarea with pixel perfect borders. It's resizable and maintains its pixel aesthetic regardless of size.",
  rows: 5,
};

export const Disabled = Template.bind({});
Disabled.args = {
  placeholder: "This textarea is disabled",
  disabled: true,
  rows: 4,
};

export const CustomStyle = Template.bind({});
CustomStyle.args = {
  placeholder: "Custom styled textarea...",
  rows: 4,
  bg: "#FEFCD0", // light yellow
  textColor: "#000000", // black
  borderColor: "#C381B5", // primary purple
};

export const LargeTextArea = Template.bind({});
LargeTextArea.args = {
  placeholder: "This is a larger textarea for more content...",
  rows: 10,
};



================================================
FILE: src/components/TextArea/TextArea.test.tsx
================================================
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { TextArea } from "./TextArea";

describe("TextArea Component", () => {
  test("renders textarea element", () => {
    render(<TextArea placeholder="Test placeholder" />);
    expect(screen.getByPlaceholderText("Test placeholder")).toBeInTheDocument();
  });

  test("applies custom className", () => {
    render(<TextArea className="custom-class" />);
    expect(screen.getByRole("textbox")).toHaveClass("custom-class");
  });

  test("handles input changes", () => {
    const handleChange = jest.fn();
    render(<TextArea onChange={handleChange} />);
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "test" },
    });
    expect(handleChange).toHaveBeenCalledTimes(1);
  });
});



================================================
FILE: src/components/TextArea/TextArea.tsx
================================================
import React, { TextareaHTMLAttributes, forwardRef, useMemo } from "react";
import styles from "./TextArea.module.css";

export interface TextAreaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  bg?: string;
  textColor?: string;
  borderColor?: string;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className = "", bg, textColor, borderColor, style, ...props }, ref) => {
    const svgString = useMemo(() => {
      const color = borderColor || "currentColor";
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><path d="M3 1h1v1h-1zM4 1h1v1h-1zM2 2h1v1h-1zM5 2h1v1h-1zM1 3h1v1h-1zM6 3h1v1h-1zM1 4h1v1h-1zM6 4h1v1h-1zM2 5h1v1h-1zM5 5h1v1h-1zM3 6h1v1h-1zM4 6h1v1h-1z" fill="${color}"/></svg>`;
      return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
    }, [borderColor]);

    const customStyle = {
      ...style,
      "--textarea-custom-bg": bg,
      "--textarea-custom-text": textColor,
      "--textarea-custom-border": borderColor,
      borderImageSource: svgString,
    };

    return (
      <textarea
        ref={ref}
        className={`${styles.pixelTextarea} font-minecraft ${className}`}
        style={customStyle}
        {...props}
      />
    );
  }
);

TextArea.displayName = "TextArea";

export { styles as TextAreaStyles };

export default TextArea;



================================================
FILE: src/styles/globals.css
================================================
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --primary-bg: theme("colors.primary.bg");
  --primary-text: theme("colors.primary.text");
  --primary-shadow: theme("colors.primary.shadow");
  --secondary-bg: theme("colors.secondary.bg");
  --secondary-text: theme("colors.secondary.text");
  --secondary-shadow: theme("colors.secondary.shadow");
  --outline-text: theme("colors.outline.text");
  --primary-bg-dropdown: white;
  --primary-bg-dropdown: #ffffff;
  --outline-text: #000000;

  /* textarea */
  --bg-textarea: #f0f0f0;
  --text-textarea: #000000;
  --border-textarea-rgb: 0, 0, 0;

  /* progressbar */
  --color-progressbar: #000000;
  --border-progressbar: #000000;

  /* input */
  --bg-input: white;
  --text-input: black;
  --border-input: black;

  /* card */
  --bg-card: white;
  --text-card: black;
  --border-card: #000000;
  --shadow-card: #767676;

  /* dropdown */
  --bg-dropdown: transparent;
  --text-dropdown: #000000;
  --border-dropdown: #000000;

  /* popup */
  --bg-popup-base: white;
  --bg-popup: #f0f0f0;
  --text-popup: black;
}

body {
  font-family: "Minecraft", sans-serif;
}



================================================
FILE: src/styles/index.ts
================================================
import globalStyles from "./globals.css";
import ButtonStyles from "../components/Button/Button.module.css";
import CardStyles from "../components/Card/Card.module.css";
import DropdownMenuStyles from "../components/Dropdown/Dropdown.module.css";
import InputStyles from "../components/Input/Input.module.css";
import ProgressBarStyles from "../components/ProgressBar/ProgressBar.module.css";
import TextAreaStyles from "../components/TextArea/TextArea.module.css";
import AccordianStyles from "../components/Accordion/Accordion.module.css";

export {
  globalStyles,
  ButtonStyles,
  CardStyles,
  DropdownMenuStyles,
  InputStyles,
  ProgressBarStyles,
  TextAreaStyles,
  AccordianStyles,
};



================================================
FILE: src/types/css.d.ts
================================================
declare module "*.css" {
  const content: { [className: string]: string };
  export default content;
}



================================================
FILE: .github/FUNDING.yml
================================================
# These are supported funding model platforms

github: Dksie09
patreon: # Replace with a single Patreon username
open_collective: # Replace with a single Open Collective username
ko_fi: # Replace with a single Ko-fi username
tidelift: # Replace with a single Tidelift platform-name/package-name e.g., npm/babel
community_bridge: # Replace with a single Community Bridge project-name e.g., cloud-foundry
liberapay: # Replace with a single Liberapay username
issuehunt: # Replace with a single IssueHunt username
lfx_crowdfunding: # Replace with a single LFX Crowdfunding project-name e.g., cloud-foundry
polar: # Replace with a single Polar username
buy_me_a_coffee: dakshiegoel
custom: # Replace with up to 4 custom sponsorship URLs e.g., ['link1', 'link2']



================================================
FILE: .github/ISSUE_TEMPLATE/bug_report.md
================================================
---
name: Bug report
about: Create a report to help us improve
title: ''
labels: ''
assignees: ''

---

**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior**
A clear and concise description of what you expected to happen.

**Screenshots**
If applicable, add screenshots to help explain your problem.

**Desktop (please complete the following information):**
 - OS: [e.g. iOS]
 - Browser [e.g. chrome, safari]
 - Version [e.g. 22]

**Smartphone (please complete the following information):**
 - Device: [e.g. iPhone6]
 - OS: [e.g. iOS8.1]
 - Browser [e.g. stock browser, safari]
 - Version [e.g. 22]

**Additional context**
Add any other context about the problem here.



================================================
FILE: .github/ISSUE_TEMPLATE/custom.md
================================================
---
name: Custom issue template
about: Describe this issue template's purpose here.
title: ''
labels: ''
assignees: ''

---





================================================
FILE: .github/ISSUE_TEMPLATE/feature_request.md
================================================
---
name: Feature request
about: Suggest an idea for this project
title: ''
labels: ''
assignees: ''

---

**Is your feature request related to a problem? Please describe.**
A clear and concise description of what the problem is. Ex. I'm always frustrated when [...]

**Describe the solution you'd like**
A clear and concise description of what you want to happen.

**Describe alternatives you've considered**
A clear and concise description of any alternative solutions or features you've considered.

**Additional context**
Add any other context or screenshots about the feature request here.



================================================
FILE: .storybook/accordion.css
================================================
/* Accordion styles for Storybook */
.accordion {
  width: 100%;
  font-family: "Minecraft", sans-serif;
  font-size: 1rem;
}

.accordionItem {
  margin-bottom: 1.25rem;
  border-style: solid;
  border-width: 5px;
  overflow: hidden;
  background-color: var(
    --accordion-item-custom-bg,
    var(--accordion-custom-bg, var(--bg-accordion, white))
  );
  color: var(
    --accordion-item-custom-text,
    var(--accordion-custom-text, var(--text-accordion, black))
  );
  border-image-slice: 3;
  border-image-width: 2;
  border-image-repeat: stretch;
  border-image-outset: 2;
  border-image-source: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8'%3E%3Cpath d='M3 1h1v1h-1zM4 1h1v1h-1zM2 2h1v1h-1zM5 2h1v1h-1zM1 3h1v1h-1zM6 3h1v1h-1zM1 4h1v1h-1zM6 4h1v1h-1zM2 5h1v1h-1zM5 5h1v1h-1zM3 6h1v1h-1zM4 6h1v1h-1z' fill='currentColor'/%3E%3C/svg%3E");
  box-shadow: 2px 2px 0 2px
      var(
        --accordion-item-custom-shadow,
        var(--accordion-custom-shadow, var(--shadow-accordion, #000000))
      ),
    -2px -2px 0 2px
      var(
        --accordion-item-custom-bg,
        var(--accordion-custom-bg, var(--bg-accordion, white))
      );
}

.accordionTrigger {
  width: 100%;
  display: flex;
  gap: 1rem;
  align-items: center;
  padding: 0.25rem 1rem;
  text-align: left;
  cursor: pointer;
  background-color: var(
    --accordion-item-custom-bg,
    var(--accordion-custom-bg, var(--bg-accordion, white))
  );
  color: var(
    --accordion-item-custom-text,
    var(--accordion-custom-text, var(--text-accordion, black))
  );
}

.accordionArrow {
  width: 1.5rem;
  height: 1.5rem;
  transition: transform 0.3s ease-in-out;
  mask-repeat: no-repeat;
  mask-position: center;
  mask-size: contain;
  -webkit-mask-repeat: no-repeat;
  -webkit-mask-position: center;
  -webkit-mask-size: contain;
  mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='512' height='512'%3E%3Cpath d='M127 21h44v43h43v42h43v43h42v43h43v42h42v44h-42v43h-43v42h-42v43h-43v42h-43v43h-44z' fill='currentColor' /%3E%3C/svg%3E");
  -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='512' height='512'%3E%3Cpath d='M127 21h44v43h43v42h43v43h42v43h43v42h42v44h-42v43h-43v42h-42v43h-43v42h-43v43h-44z' fill='currentColor' /%3E%3C/svg%3E");
  background-color: currentColor;
}

.accordionContent {
  transition: all 0.3s ease-in-out;
  overflow: hidden;
  background-color: var(
    --accordion-item-custom-bg,
    var(--accordion-custom-bg, var(--bg-accordion, white))
  );
  color: var(
    --accordion-item-custom-text,
    var(--accordion-custom-text, var(--text-accordion, black))
  );
  max-height: 0;
  opacity: 0;
}

.accordionContentInner {
  padding: 1rem;
  font-size: 0.875rem;
  border-top-width: 1px;
  border-color: #e5e7eb;
}

/* Active states */
.accordionItem.active {
  /* Add active styles here if needed */
}

.accordionContent.active {
  max-height: 1000px;
  opacity: 1;
}

/* Ensure arrow rotation works correctly */
.accordionItem.active .accordionArrow {
  transform: rotate(90deg);
}



================================================
FILE: .storybook/bubble.css
================================================
/* Bubble styles for Storybook */
.balloon {
  border-radius: 4px;
  position: relative;
  display: inline-block;
  padding: 1rem 1.5rem;
  margin: 8px;
  margin-bottom: 30px;
  background-color: var(--bubble-bg-color, #ffffff);
  color: var(--bubble-text-color, #000000);
  cursor: pointer;
  font-family: "Minecraft", sans-serif;
}

.balloon > :last-child {
  margin-bottom: 0;
}

.balloon::before,
.balloon::after {
  position: absolute;
  content: "";
}

.balloon.from-left::before,
.balloon.from-left::after {
  left: 2rem;
}

.balloon.from-left::before {
  bottom: -14px;
  width: 26px;
  height: 10px;
  background-color: var(--bubble-bg-color, #ffffff);
  border-right: 4px solid var(--bubble-border-color, #000000);
  border-left: 4px solid var(--bubble-border-color, #000000);
}

.balloon.from-left::after {
  bottom: -18px;
  width: 18px;
  height: 4px;
  margin-right: 8px;
  background-color: var(--bubble-bg-color, #ffffff);
  box-shadow: -4px 0 var(--bubble-border-color, #000000),
    4px 0 var(--bubble-border-color, #000000),
    -4px 4px var(--bubble-bg-color, #ffffff),
    0 4px var(--bubble-border-color, #000000),
    -8px 4px var(--bubble-border-color, #000000),
    -4px 8px var(--bubble-border-color, #000000),
    -8px 8px var(--bubble-border-color, #000000);
}

.balloon.from-right::before,
.balloon.from-right::after {
  right: 2rem;
}

.balloon.from-right::before {
  bottom: -14px;
  width: 26px;
  height: 10px;
  background-color: var(--bubble-bg-color, #ffffff);
  border-right: 4px solid var(--bubble-border-color, #000000);
  border-left: 4px solid var(--bubble-border-color, #000000);
}

.balloon.from-right::after {
  bottom: -18px;
  width: 18px;
  height: 4px;
  margin-left: 8px;
  background-color: var(--bubble-bg-color, #ffffff);
  box-shadow: -4px 0 var(--bubble-border-color, #000000),
    4px 0 var(--bubble-border-color, #000000),
    4px 4px var(--bubble-bg-color, #ffffff),
    0 4px var(--bubble-border-color, #000000),
    8px 4px var(--bubble-border-color, #000000),
    4px 8px var(--bubble-border-color, #000000),
    8px 8px var(--bubble-border-color, #000000);
}

.roundedCorners {
  border-style: solid;
  border-width: 4px;
  border-image-slice: 3;
  border-image-width: 3;
  border-image-repeat: stretch;
  border-image-source: var(--bubble-border-image);
  border-image-outset: 2;
}



================================================
FILE: .storybook/button.css
================================================
/* Button styles for Storybook */
.pixelButton {
  position: relative;
  display: inline-block;
  border-style: solid;
  border-width: 5px;
  padding: 0.5rem;
  margin: 0.75rem;
  font-family: "Minecraft", sans-serif;
  background-color: var(--button-custom-bg, var(--bg-button, #f0f0f0));
  color: var(--button-custom-text, var(--text-button, #000000));
  box-shadow: 2px 2px 0 2px
      var(--button-custom-shadow, var(--shadow-button, #000000)),
    -2px -2px 0 2px var(--button-custom-bg, var(--bg-button, #f0f0f0));
  border-image-slice: 3;
  border-image-width: 2;
  border-image-repeat: stretch;
  border-image-outset: 2;
  border-color: var(--button-custom-border, var(--border-button, #000000));
  cursor: pointer;
}

.pixelButton:active {
  transform: translateY(2px);
  box-shadow: 2px 2px 0 2px var(--button-custom-bg, var(--bg-button, #f0f0f0)),
    -2px -2px 0 2px var(--button-custom-bg, var(--bg-button, #f0f0f0));
}



================================================
FILE: .storybook/card.css
================================================
/* Card styles for Storybook */
.pixelCard {
  margin: 0.5rem;
  border-style: solid;
  border-width: 5px;
  font-family: "Minecraft", sans-serif;
  font-size: 1rem;
  padding: 1rem;
  background-color: var(--card-custom-bg, var(--bg-card, white));
  color: var(--card-custom-text, var(--text-card, black));
  border-image-slice: 3;
  border-image-width: 2;
  border-image-repeat: stretch;
  border-image-outset: 2;
  box-shadow: 2px 2px 0 2px
      var(--card-custom-shadow, var(--shadow-card, #000000)),
    -2px -2px 0 2px var(--card-custom-bg, var(--bg-card, white));
  border-color: var(--card-custom-border, var(--border-card, #000000));
}



================================================
FILE: .storybook/dropdown.css
================================================
/* Dropdown styles for Storybook */
.dropdownMenu {
  position: relative;
  display: inline-block;
  font-family: "Press Start 2P", cursive;
  font-size: 10px;
}

.pixelButton {
  border: 0;
  border-style: solid;
  border-width: 4px;
  border-image-slice: 2;
  border-image-width: 2;
  border-image-outset: 0;
  border-image-repeat: stretch;
  border-image-source: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='8' height='8'><path d='M3 1h1v1h-1zM4 1h1v1h-1zM2 2h1v1h-1zM5 2h1v1h-1zM1 3h1v1h-1zM6 3h1v1h-1zM1 4h1v1h-1zM6 4h1v1h-1zM2 5h1v1h-1zM5 5h1v1h-1zM3 6h1v1h-1zM4 6h1v1h-1z' fill='black'/></svg>");
  padding: 12px 16px;
  margin: 0;
  background-color: var(--button-custom-bg, #ffffff);
  color: var(--button-custom-text, #000000);
  box-shadow: var(--button-custom-shadow, 4px 4px 0 0 rgba(0, 0, 0, 1));
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 100px;
  transition: transform 0.1s, box-shadow 0.1s;
}

.pixelButton:active {
  transform: translate(4px, 4px);
  box-shadow: none;
}

.dropdownMenuTrigger {
  gap: 10px;
}

.dropdownArrow {
  display: inline-block;
  width: 10px;
  height: 10px;
  transition: transform 0.2s ease;
}

.dropdownMenuContent {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  background-color: var(--dropdown-content-custom-bg, #ffffff);
  color: var(--dropdown-content-custom-text, #000000);
  border: 0;
  border-style: solid;
  border-width: 4px;
  border-image-slice: 2;
  border-image-width: 2;
  border-image-outset: 0;
  border-image-repeat: stretch;
  border-image-source: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='8' height='8'><path d='M3 1h1v1h-1zM4 1h1v1h-1zM2 2h1v1h-1zM5 2h1v1h-1zM1 3h1v1h-1zM6 3h1v1h-1zM1 4h1v1h-1zM6 4h1v1h-1zM2 5h1v1h-1zM5 5h1v1h-1zM3 6h1v1h-1zM4 6h1v1h-1z' fill='black'/></svg>");
  padding: 8px;
  z-index: 10;
  box-shadow: var(
    --dropdown-content-custom-shadow,
    4px 4px 0 0 rgba(0, 0, 0, 1)
  );
}

.dropdownMenuLabel {
  padding: 4px 8px;
  margin-bottom: 4px;
  color: #666;
  font-size: 10px;
}

.dropdownMenuItem {
  padding: 8px;
  cursor: pointer;
  transition: background-color 0.1s;
}

.dropdownMenuItem:hover {
  background-color: rgba(0, 0, 0, 0.1);
}

.dropdownMenuSeparator {
  height: 2px;
  background-color: #000;
  margin: 6px 0;
}



================================================
FILE: .storybook/input.css
================================================
/* Input styles for Storybook */
.pixelContainer {
  position: relative;
  display: inline-block;
  border-style: solid;
  border-width: 5px;
  margin: 0.5rem 0.25rem;
  background-color: var(--input-custom-bg, var(--bg-input, white));
  color: var(--input-custom-text, var(--text-input, black));
  border-image-slice: 3;
  border-image-width: 2;
  border-image-repeat: stretch;
  border-image-outset: 2;
  font-size: 16px;
  box-shadow: 2px 2px 0 2px var(--input-custom-bg, var(--bg-input, white)),
    -2px -2px 0 2px var(--input-custom-bg, var(--bg-input, white));
  border-color: var(--input-custom-border, var(--border-input, black));
}

.pixelInput {
  background-color: transparent;
  padding: 0.25rem 0.5rem;
  width: 100%;
  padding-right: 1.75rem;
  font-family: "Minecraft", sans-serif;
  color: inherit;
}

.pixelInput:focus {
  outline: none;
}

.pixelInputIconButton {
  padding: 0.25rem;
  margin-right: 0.25rem;
  position: absolute;
  right: 0;
  top: 0;
}

.pixelInputIconButton:active {
  top: 2px;
}



================================================
FILE: .storybook/main.ts
================================================
import type { StorybookConfig } from "@storybook/react-webpack5";
import path from "path";

const config: StorybookConfig = {
  stories: ["../src/components/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: [
    "@storybook/addon-webpack5-compiler-swc",
    "@storybook/addon-essentials",
    "@storybook/addon-onboarding",
    "@storybook/addon-interactions",
  ],
  framework: {
    name: "@storybook/react-webpack5",
    options: {},
  },
  webpackFinal: async (config) => {
    if (config.module && config.module.rules) {
      // Filter out the existing CSS rule
      const cssRule = config.module.rules.find(
        (rule) =>
          rule &&
          typeof rule !== "string" &&
          rule.test instanceof RegExp &&
          rule.test.test(".css")
      );

      if (cssRule && typeof cssRule !== "string") {
        // Remove it from the rules
        config.module.rules = config.module.rules.filter(
          (rule) => rule !== cssRule
        );
      }

      // First add a rule for .storybook CSS files (non-modules)
      config.module.rules.push({
        test: /\.css$/,
        use: ["style-loader", "css-loader", "postcss-loader"],
        include: [path.resolve(__dirname, "./")],
      });

      // Then add our custom CSS loader configuration for all other CSS
      config.module.rules.push({
        test: /\.css$/,
        use: [
          "style-loader",
          {
            loader: "css-loader",
            options: {
              importLoaders: 1,
              modules: {
                auto: true, // Enable CSS modules for files ending with .module.css
                localIdentName: "[name]__[local]--[hash:base64:5]",
              },
            },
          },
          {
            loader: "postcss-loader",
            options: {
              postcssOptions: {
                plugins: ["tailwindcss", "autoprefixer"],
              },
            },
          },
        ],
        include: path.resolve(__dirname, "../src"),
      });
    }

    return config;
  },
};

export default config;



================================================
FILE: .storybook/popup.css
================================================
/* Popup styles for Storybook */

.pixelPopupOverlay {
  position: fixed;
  inset: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 50;
  background-color: var(--popup-overlay-bg, rgba(0, 0, 0, 0.5));
}

.pixelPopup {
  position: relative;
  padding: 4px;
  background-color: var(--popup-base-bg, var(--bg-popup-base, white));
  color: var(--popup-text, var(--text-popup, black));
  border-style: solid;
  border-width: 5px;
  border-image-slice: 3;
  border-image-width: 2;
  border-image-repeat: stretch;
  border-image-source: var(--popup-border-svg);
  border-image-outset: 2;
  box-shadow: 2px 2px 0 2px var(--popup-base-bg, var(--bg-popup-base, white)),
    -2px -2px 0 2px var(--popup-base-bg, var(--bg-popup-base, white));
}

.pixelPopupInner {
  padding: 1rem;
  background-color: var(--popup-bg, var(--bg-popup, #f0f0f0));
  color: var(--popup-text, var(--text-popup, black));
  border-style: solid;
  border-width: 5px;
  border-image-slice: 3;
  border-image-width: 2;
  border-image-repeat: stretch;
  border-image-source: var(--popup-border-svg);
  border-image-outset: 2;
  box-shadow: 2px 2px 0 2px var(--popup-bg, var(--bg-popup, #f0f0f0)),
    -2px -2px 0 2px var(--popup-bg, var(--bg-popup, #f0f0f0));
}

.pixelPopupTitle {
  font-size: 1.5rem;
  margin-bottom: 1rem;
  text-align: center;
  font-family: "Minecraft", sans-serif;
}

.pixelPopupCloseButton {
  position: absolute;
  top: 4px;
  right: 8px;
  background-color: transparent;
  border: none;
  cursor: pointer;
  font-size: 1.25rem;
  font-family: "Minecraft", sans-serif;
  color: var(--popup-text, var(--text-popup, black));
}

.pixelPopupContent {
  font-family: "Minecraft", sans-serif;
}



================================================
FILE: .storybook/preview.ts
================================================
import type { Preview } from "@storybook/react";
// Import Tailwind CSS from globals
import "../src/styles/globals.css";
// Import a custom CSS file for Storybook that will handle fonts properly
import "./storybook.css";
// Import the component styles but not the fonts from the main app
import "../src/retroui.css";
// Import custom accordion styles for Storybook
import "./accordion.css";
// Import button styles for Storybook
import "./button.css";
// Import card styles for Storybook
import "./card.css";
// Import input styles for Storybook
import "./input.css";
// Import textarea styles for Storybook
import "./textarea.css";
// Import progressbar styles for Storybook
import "./progressbar.css";
// Import bubble styles for Storybook
import "./bubble.css";
// Import dropdown styles for Storybook
import "./dropdown.css";
// Import popup styles for Storybook
import "./popup.css";
// Import other CSS files as needed

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;



================================================
FILE: .storybook/progressbar.css
================================================
/* ProgressBar styles for Storybook */
.pixelProgressbarContainer {
  position: relative;
  width: 100%;
  height: 30px;
  padding: 2px;
  border-style: solid;
  border-width: 5px;
  border-image-slice: 3;
  border-image-width: 2;
  border-image-repeat: stretch;
  background-color: transparent;
  border-color: var(
    --progressbar-custom-border-color,
    var(--border-progressbar, #000000)
  );
}

.pixelProgressbar {
  height: 100%;
  opacity: 50%;
  background-color: var(
    --progressbar-custom-color,
    var(--color-progressbar, #000000)
  );
}

/* Sizes */
.pixelProgressbarSm {
  height: 20px;
}

.pixelProgressbarMd {
  height: 30px;
}

.pixelProgressbarLg {
  height: 40px;
}



================================================
FILE: .storybook/storybook.css
================================================
/* Font declarations for Storybook */
@font-face {
  font-family: "Minecraft";
  src: url("../fonts/Minecraft.otf") format("opentype");
  font-weight: normal;
  font-style: normal;
}

@font-face {
  font-family: "Minecraft";
  src: url("../fonts/Minecraft-Bold.otf") format("opentype");
  font-weight: bold;
  font-style: normal;
}

body {
  font-family: "Minecraft", sans-serif;
}



================================================
FILE: .storybook/textarea.css
================================================
/* TextArea styles for Storybook */
.pixelTextarea {
  width: 100%;
  padding: 0.5rem;
  font-size: 1rem;
  min-height: 100px;
  resize: vertical;
  outline: none;
  font-family: "Minecraft", sans-serif;
  background-color: var(--textarea-custom-bg, var(--bg-textarea, #f0f0f0));
  color: var(--textarea-custom-text, var(--text-textarea, #000000));
  border-style: solid;
  box-shadow: 2px 2px 0 2px
      var(--textarea-custom-bg, var(--bg-textarea, #f0f0f0)),
    -2px -2px 0 2px var(--textarea-custom-bg, var(--bg-textarea, #f0f0f0));
  border-width: 5px;
  border-image-slice: 3;
  border-image-width: 2;
  border-image-repeat: stretch;
  border-image-outset: 2;
  border-color: var(--textarea-custom-border, var(--border-textarea, #000000));
}

.pixelTextarea:focus {
  outline: none;
}



================================================
FILE: .storybook/.postcssrc.js
================================================
module.exports = {
    plugins: {
        tailwindcss: {},
        autoprefixer: {}
    }
} 


================================================
FILE: .storybook/components/Accordion.tsx
================================================
import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  CSSProperties,
} from "react";
// Using global class names instead of CSS modules

interface AccordionContextType {
  activeItem: string | null;
  setActiveItem: React.Dispatch<React.SetStateAction<string | null>>;
  bg?: string;
  textColor?: string;
  borderColor?: string;
  shadowColor?: string;
  collapsible: boolean;
}

const AccordionContext = createContext<AccordionContextType | null>(null);

export interface AccordionProps {
  children: React.ReactNode;
  collapsible?: boolean;
  className?: string;
  bg?: string;
  textColor?: string;
  borderColor?: string;
  shadowColor?: string;
  style?: CSSProperties;
}

export const Accordion = ({
  children,
  collapsible = false,
  className = "",
  bg,
  textColor,
  borderColor,
  shadowColor,
  style,
  ...props
}: AccordionProps): JSX.Element => {
  const [activeItem, setActiveItem] = useState<string | null>(null);

  const customStyle = {
    ...style,
    "--accordion-custom-bg": bg,
    "--accordion-custom-text": textColor,
    "--accordion-custom-border": borderColor,
    "--accordion-custom-shadow": shadowColor,
  } as CSSProperties;

  return (
    <AccordionContext.Provider
      value={{
        activeItem,
        setActiveItem,
        bg,
        textColor,
        borderColor,
        shadowColor,
        collapsible,
      }}
    >
      <div className={`accordion ${className}`} style={customStyle} {...props}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
};

export interface AccordionItemProps {
  children: React.ReactNode;
  value: string;
  bg?: string;
  textColor?: string;
  borderColor?: string;
  shadowColor?: string;
}

const AccordionItemContext = createContext<{ value: string }>({ value: "" });

export const AccordionItem: React.FC<AccordionItemProps> = ({
  children,
  value,
  bg,
  textColor,
  borderColor,
  shadowColor,
}) => {
  const context = useContext(AccordionContext);
  const isActive = context?.activeItem === value;

  const borderSvg = useMemo(() => {
    const color = borderColor || context?.borderColor || "currentColor";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><path d="M3 1h1v1h-1zM4 1h1v1h-1zM2 2h1v1h-1zM5 2h1v1h-1zM1 3h1v1h-1zM6 3h1v1h-1zM1 4h1v1h-1zM6 4h1v1h-1zM2 5h1v1h-1zM5 5h1v1h-1zM3 6h1v1h-1zM4 6h1v1h-1z" fill="${color}"/></svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  }, [borderColor, context?.borderColor]);

  const customStyle = {
    "--accordion-item-custom-bg": bg || context?.bg,
    "--accordion-item-custom-text": textColor || context?.textColor,
    "--accordion-item-custom-border": borderColor || context?.borderColor,
    "--accordion-item-custom-shadow": shadowColor || context?.shadowColor,
    borderImageSource: borderSvg,
  } as CSSProperties;

  return (
    <AccordionItemContext.Provider value={{ value }}>
      <div
        className={`accordionItem ${isActive ? "active" : ""}`}
        style={customStyle}
      >
        {children}
      </div>
    </AccordionItemContext.Provider>
  );
};

export interface AccordionTriggerProps {
  children: React.ReactNode;
}

export const AccordionTrigger: React.FC<AccordionTriggerProps> = ({
  children,
}) => {
  const context = useContext(AccordionContext);
  const item = useContext(AccordionItemContext);

  const handleClick = () => {
    if (context) {
      context.setActiveItem((prevActiveItem) => {
        if (context.collapsible && prevActiveItem === item.value) {
          return null;
        }
        return prevActiveItem === item.value ? prevActiveItem : item.value;
      });
    }
  };

  const isActive = context?.activeItem === item.value;

  const arrowSvg = useMemo(() => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><path d="M127 21h44v43h43v42h43v43h42v43h43v42h42v44h-42v43h-43v42h-42v43h-43v42h-43v43h-44z" fill="currentColor" /></svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  }, []);

  return (
    <button className="accordionTrigger" onClick={handleClick}>
      <div
        className="accordionArrow"
        style={{
          transform: isActive ? "rotate(90deg)" : "rotate(0deg)",
        }}
      />
      {children}
    </button>
  );
};

export interface AccordionContentProps {
  children: React.ReactNode;
}

export const AccordionContent: React.FC<AccordionContentProps> = ({
  children,
}) => {
  const context = useContext(AccordionContext);
  const item = useContext(AccordionItemContext);
  const isActive = context?.activeItem === item.value;

  return (
    <div className={`accordionContent ${isActive ? "active" : ""}`}>
      <div className="accordionContentInner">{children}</div>
    </div>
  );
};


