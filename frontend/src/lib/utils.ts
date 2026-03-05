import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { parseISO, isValid } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const safeParseDate = (dateStr: any): Date => {
  if (!dateStr) return new Date();
  if (dateStr instanceof Date) return dateStr;
  try {
    const parsed = parseISO(dateStr);
    return isValid(parsed) ? parsed : new Date();
  } catch (e) {
    return new Date();
  }
};
