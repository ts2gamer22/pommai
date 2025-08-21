'use client';

import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';

interface TabsContextType {
  value: string;
  onChange: (value: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

export interface TabsProps {
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
  children: ReactNode;
  className?: string;
}

export const Tabs = ({ value, onValueChange, defaultValue, children, className = '' }: TabsProps) => {
  const [internalValue, setInternalValue] = useState(defaultValue || '');
  
  const actualValue = value !== undefined ? value : internalValue;
  const actualOnChange = onValueChange || setInternalValue;

  return (
    <TabsContext.Provider value={{ value: actualValue, onChange: actualOnChange }}>
      <div className={`tabs ${className}`}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

export interface TabsListProps {
  children: ReactNode;
  className?: string;
  borderColor?: string;
  shadowColor?: string;
  bg?: string;
}

export const TabsList = ({ children, className = '', borderColor = 'black', shadowColor = '#c381b5', bg = 'white' }: TabsListProps) => {
  const svgString = useMemo(() => {
    const color = borderColor || 'black';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><path d="M3 1h1v1h-1zM4 1h1v1h-1zM2 2h1v1h-1zM5 2h1v1h-1zM1 3h1v1h-1zM6 3h1v1h-1zM1 4h1v1h-1zM6 4h1v1h-1zM2 5h1v1h-1zM5 5h1v1h-1zM3 6h1v1h-1zM4 6h1v1h-1z" fill="${color}"/></svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  }, [borderColor]);

  return (
    <div 
      className={`flex gap-1 p-1 border-[5px] border-solid relative ${className}`}
      style={{
        backgroundColor: bg,
        borderColor: borderColor,
        borderImageSource: svgString,
        borderImageSlice: 3,
        borderImageWidth: 2,
        borderImageRepeat: 'stretch',
        borderImageOutset: 2,
        boxShadow: `2px 2px 0 2px ${shadowColor}, -2px -2px 0 2px ${bg}`,
      }}
    >
      {children}
    </div>
  );
};

export interface TabsTriggerProps {
  value: string;
  children: ReactNode;
  className?: string;
}

export const TabsTrigger = ({ value, children, className = '' }: TabsTriggerProps) => {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabsTrigger must be used within Tabs');
  
  const isActive = context.value === value;
  
  const svgString = useMemo(() => {
    const color = 'black';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><path d="M3 1h1v1h-1zM4 1h1v1h-1zM2 2h1v1h-1zM5 2h1v1h-1zM1 3h1v1h-1zM6 3h1v1h-1zM1 4h1v1h-1zM6 4h1v1h-1zM2 5h1v1h-1zM5 5h1v1h-1zM3 6h1v1h-1zM4 6h1v1h-1z" fill="${color}"/></svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  }, []);
  
  return (
    <button
      onClick={() => context.onChange(value)}
      className={`px-4 py-2 font-bold uppercase tracking-wider transition-all border-[5px] border-solid relative ${
        isActive 
          ? 'text-white translate-y-[-2px]' 
          : 'text-black hover:translate-y-[-1px]'
      } ${className}`}
      style={{
        backgroundColor: isActive ? '#c381b5' : '#f8f8f8',
        borderColor: 'black',
        borderImageSource: svgString,
        borderImageSlice: 3,
        borderImageWidth: 2,
        borderImageRepeat: 'stretch',
        borderImageOutset: 2,
        boxShadow: isActive 
          ? '2px 2px 0 2px #8b5fa3, -2px -2px 0 2px #c381b5' 
          : '2px 2px 0 2px #e0e0e0, -2px -2px 0 2px #f8f8f8',
      }}
    >
      {children}
    </button>
  );
};

export interface TabsContentProps {
  value: string;
  children: ReactNode;
  className?: string;
}

export const TabsContent = ({ value, children, className = '' }: TabsContentProps) => {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabsContent must be used within Tabs');
  
  if (context.value !== value) return null;
  
  return (
    <div className={`tabs-content ${className}`}>
      {children}
    </div>
  );
};
