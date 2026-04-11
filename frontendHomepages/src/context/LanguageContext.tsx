import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Language = "kinyarwanda" | "english" | "french";

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

const STORAGE_KEY = "ksl_language";

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window === "undefined") return "kinyarwanda";
    const stored = window.localStorage.getItem(STORAGE_KEY) as Language | null;
    return stored ?? "kinyarwanda";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, language);
  }, [language]);

  const setLanguage = (value: Language) => {
    setLanguageState(value);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};

