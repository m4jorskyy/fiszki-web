import { pl } from "./pl";
import { en } from "./en";

export type Locale = "pl" | "en";

export const translations = {
  pl,
  en,
} as const;

export type Translations = (typeof translations)[Locale];
