export type AvailableLanguages = "es" | "en";

export const LanguagesList: AvailableLanguages[] = ["es", "en"];
export const defaultLocale: AvailableLanguages = "es";

export type ReplacementParams = Record<string, string>;
export type DictionaryEntry = Record<string, string>;
export type Dictionary = Record<AvailableLanguages, DictionaryEntry>;
