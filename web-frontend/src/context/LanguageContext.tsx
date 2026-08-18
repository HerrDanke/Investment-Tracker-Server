import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { translations, type Lang } from '../lib/translations';

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

function detectInitialLang(): Lang {
  try {
    const stored = localStorage.getItem('lang');
    if (stored === 'zh' || stored === 'en') return stored;
  } catch { /* ignore */ }
  // Default: detect from browser
  return navigator.language.startsWith('zh') ? 'zh' : 'en';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(detectInitialLang);

  useEffect(() => {
    localStorage.setItem('lang', lang);
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  }, [lang]);

  const t = (key: string) => translations[lang][key] || key;

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLang must be used within LanguageProvider');
  return ctx;
}
