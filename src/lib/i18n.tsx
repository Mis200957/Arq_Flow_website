"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type Lang = "ar" | "en";

type LangContextValue = {
  lang: Lang;
  dir: "rtl" | "ltr";
  setLang: (l: Lang) => void;
  /** Pick a localized value from an { ar, en } pair */
  pick: <T>(pair: { ar: T; en: T }) => T;
};

const LangContext = createContext<LangContextValue>({
  lang: "ar",
  dir: "rtl",
  setLang: () => {},
  pick: (pair) => pair.ar,
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ar");

  useEffect(() => {
    const saved =
      typeof document !== "undefined"
        ? (document.cookie.match(/(?:^|; )arqflow_lang=(ar|en)/)?.[1] as Lang | undefined)
        : undefined;
    if (saved && saved !== lang) setLangState(saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    document.cookie = `arqflow_lang=${lang}; path=/; max-age=31536000; SameSite=Lax`;
  }, [lang]);

  const value: LangContextValue = {
    lang,
    dir: lang === "ar" ? "rtl" : "ltr",
    setLang: setLangState,
    pick: (pair) => pair[lang],
  };

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);

/** Shorthand for components with local dictionaries: const t = useT({ ar: {...}, en: {...} }) */
export function useT<T>(dict: { ar: T; en: T }): T {
  const { lang } = useLang();
  return dict[lang];
}
