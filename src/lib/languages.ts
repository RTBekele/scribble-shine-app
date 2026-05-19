// Supported languages for story generation + browser TTS.
// `code` follows BCP-47 so window.speechSynthesis can use it.
export const LANGUAGES = [
  { code: "en-US", label: "English" },
  { code: "es-ES", label: "Español" },
  { code: "fr-FR", label: "Français" },
  { code: "de-DE", label: "Deutsch" },
  { code: "it-IT", label: "Italiano" },
  { code: "pt-BR", label: "Português" },
  { code: "nl-NL", label: "Nederlands" },
  { code: "sv-SE", label: "Svenska" },
  { code: "pl-PL", label: "Polski" },
  { code: "tr-TR", label: "Türkçe" },
  { code: "ar-SA", label: "العربية" },
  { code: "he-IL", label: "עברית" },
  { code: "hi-IN", label: "हिन्दी" },
  { code: "bn-IN", label: "বাংলা" },
  { code: "zh-CN", label: "中文 (简体)" },
  { code: "ja-JP", label: "日本語" },
  { code: "ko-KR", label: "한국어" },
  { code: "ru-RU", label: "Русский" },
  { code: "uk-UA", label: "Українська" },
  { code: "sw-KE", label: "Kiswahili" },
  { code: "am-ET", label: "አማርኛ" },
  { code: "yo-NG", label: "Yorùbá" },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]["code"];
