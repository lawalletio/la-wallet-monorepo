export type AvailableLanguages = 'es' | 'en';
export type ReplacementParams = Record<string, string>;
export type DictionaryEntry = Record<string, string>;
export type Dictionary = Record<AvailableLanguages, DictionaryEntry>;
