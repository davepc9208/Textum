import { createContext, useContext, useState, ReactNode } from 'react';
import { Lang, translations, Translations } from './translations';

interface LangContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Translations;
  isTransitioning: boolean;
}

const LangContext = createContext<LangContextType | null>(null);

// Duración total del barrido (debe coincidir con el keyframe en index.css)
const SWEEP_MS = 700;
// Momento en que cambiamos el contenido (cuando la cortina cubre toda la pantalla)
const CONTENT_SWAP_MS = 350;

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('es');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const t = translations[lang];

  const setLang = (l: Lang) => {
    if (l === lang || isTransitioning) return;
    setIsTransitioning(true);

    window.setTimeout(() => {
      setLangState(l);
    }, CONTENT_SWAP_MS);

    window.setTimeout(() => {
      setIsTransitioning(false);
    }, SWEEP_MS);
  };

  return (
    <LangContext.Provider value={{ lang, setLang, t, isTransitioning }}>
      {children}
      {isTransitioning && (
        <div className="lang-sweep-overlay" aria-hidden="true">
          <div className="lang-sweep-curtain" />
        </div>
      )}
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used inside LangProvider');
  return ctx;
}
