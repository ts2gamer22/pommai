/**
 * Utility function for combining class names
 * A simple implementation of clsx/classnames functionality
 */

export type ClassDictionary = Record<string, unknown>;
export type ClassArray = ClassValue[];
export type ClassValue = string | number | boolean | undefined | null | ClassDictionary | ClassArray;

export function cn(...inputs: ClassValue[]): string {
  const classes: string[] = [];

  for (const input of inputs) {
    if (!input) continue;

    if (typeof input === 'string' || typeof input === 'number') {
      classes.push(String(input));
    } else if (Array.isArray(input)) {
      const nested = cn(...(input as ClassValue[]));
      if (nested) classes.push(nested);
    } else if (typeof input === 'object') {
      const dict = input as ClassDictionary;
      for (const key in dict) {
        if (Object.prototype.hasOwnProperty.call(dict, key)) {
          if (dict[key]) classes.push(key);
        }
      }
    }
  }

  return classes.join(' ');
}
