'use client';

import React, { useState } from 'react';
import {
  Button,
  Card,
  Input,
  TextArea,
  ProgressBar,
  Popup,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
  Bubble,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent
} from '@/components';

export default function DemoPage() {
  const [popupOpen, setPopupOpen] = useState(false);
  const [progress, setProgress] = useState(50);
  const [inputValue, setInputValue] = useState('');

  return (
    <div className="p-8 space-y-8 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-8">RetroUI Components Demo</h1>

      {/* Button Component */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Button</h2>
        <div className="flex gap-4 flex-wrap">
          <Button 
            bg="#fefcd0"
            textColor="black"
            borderColor="black"
            shadow="#c381b5"
            onClick={() => alert('Default themed button clicked!')}
          >
            Default Button
          </Button>
          <Button
            bg="#c381b5"
            textColor="#fefcd0"
            borderColor="black"
            shadow="#fefcd0"
            onClick={() => alert('Purple button clicked!')}
          >
            Purple Button
          </Button>
          <Button
            bg="#92cd41"
            textColor="white"
            borderColor="black"
            shadow="#76a83a"
            onClick={() => alert('Green button clicked!')}
          >
            Green Button
          </Button>
        </div>
      </section>

      {/* Card Component */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Card</h2>
        <div className="flex gap-4 flex-wrap">
          <Card 
            bg="#fefcd0" 
            textColor="black" 
            borderColor="black" 
            shadowColor="#c381b5"
            className="max-w-xs"
          >
            <h3 className="font-bold mb-2">Default Card</h3>
            <p>This is a card with the default retro theme styling.</p>
          </Card>
          <Card 
            bg="#c381b5" 
            textColor="#fefcd0" 
            borderColor="black" 
            shadowColor="#fefcd0"
            className="max-w-xs"
          >
            <h3 className="font-bold mb-2">Purple Card</h3>
            <p>This card has inverted purple theme colors.</p>
          </Card>
        </div>
      </section>

      {/* Input Component */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Input</h2>
        <div className="flex gap-4 flex-wrap">
          <Input
            placeholder="Enter text..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            bg="#fefcd0"
            textColor="black"
            borderColor="black"
          />
          <Input
            placeholder="Purple themed input..."
            bg="#c381b5"
            textColor="#fefcd0"
            borderColor="black"
          />
        </div>
      </section>

      {/* TextArea Component */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">TextArea</h2>
        <TextArea
          placeholder="Enter your message here..."
          rows={4}
          className="max-w-md"
          bg="#fefcd0"
          textColor="black"
          borderColor="black"
        />
      </section>

      {/* ProgressBar Component */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">ProgressBar</h2>
        <div className="space-y-2 max-w-md">
          <ProgressBar progress={progress} size="sm" color="#92cd41" borderColor="black" />
          <ProgressBar progress={progress} size="md" color="#c381b5" borderColor="black" />
          <ProgressBar progress={progress} size="lg" color="#fefcd0" borderColor="black" />
          <div className="flex gap-2 mt-4">
            <Button 
              bg="#fefcd0"
              textColor="black"
              borderColor="black"
              shadow="#c381b5"
              onClick={() => setProgress(Math.max(0, progress - 10))}
            >
              -10
            </Button>
            <Button 
              bg="#fefcd0"
              textColor="black"
              borderColor="black"
              shadow="#c381b5"
              onClick={() => setProgress(Math.min(100, progress + 10))}
            >
              +10
            </Button>
          </div>
        </div>
      </section>

      {/* Popup Component */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Popup</h2>
        <Button 
          bg="#fefcd0"
          textColor="black"
          borderColor="black"
          shadow="#c381b5"
          onClick={() => setPopupOpen(true)}
        >
          Open Popup
        </Button>
        <Popup
          isOpen={popupOpen}
          onClose={() => setPopupOpen(false)}
          title="Hello RetroUI!"
          bg="#fefcd0"
          textColor="black"
          borderColor="black"
        >
          <p>This is a pixel-perfect popup component!</p>
          <p className="mt-2">Click the X or outside to close.</p>
        </Popup>
      </section>

      {/* Dropdown Component */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Dropdown</h2>
        <DropdownMenu
          bg="#fefcd0"
          textColor="black"
          borderColor="black"
          shadowColor="#c381b5"
        >
          <DropdownMenuTrigger
            bg="#fefcd0"
            textColor="black"
            borderColor="black"
            shadow="#c381b5"
          >
            Open Menu
          </DropdownMenuTrigger>
          <DropdownMenuContent
            bg="#fefcd0"
            textColor="black"
            borderColor="black"
            shadowColor="#c381b5"
          >
            <DropdownMenuLabel>Options</DropdownMenuLabel>
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </section>

      {/* Bubble Component */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Bubble</h2>
        <div className="flex gap-8 flex-wrap">
          <Bubble 
            direction="left" 
            bg="#fefcd0"
            textColor="black"
            borderColor="black"
            onClick={() => alert('Left bubble clicked!')}
          >
            Speech bubble from the left
          </Bubble>
          <Bubble
            direction="right"
            bg="#c381b5"
            textColor="#fefcd0"
            borderColor="black"
            onClick={() => alert('Right bubble clicked!')}
          >
            Speech bubble from the right
          </Bubble>
        </div>
      </section>

      {/* Accordion Component */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Accordion</h2>
        <div className="max-w-md">
          <Accordion 
            collapsible
            bg="#fefcd0"
            textColor="black"
            borderColor="black"
            shadowColor="#c381b5"
          >
            <AccordionItem value="item-1">
              <AccordionTrigger>First Section</AccordionTrigger>
              <AccordionContent>
                <p>This is the content for the first accordion item.</p>
                <p>You can put any React components here.</p>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>Second Section</AccordionTrigger>
              <AccordionContent>
                <p>This is the content for the second accordion item.</p>
                <p>The accordion is collapsible by default.</p>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>Third Section</AccordionTrigger>
              <AccordionContent>
                <p>This is the content for the third accordion item.</p>
                <p>You can customize colors using props.</p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>
    </div>
  );
}
