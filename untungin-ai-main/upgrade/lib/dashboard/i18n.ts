"use client";

import { useEffect, useState } from "react";

export type Locale = "id" | "en" | "ms";

export const LOCALE_EVENT = "untungin-locale-change";

export function normalizeLocale(value: unknown): Locale {
  return value === "en" || value === "ms" || value === "id" ? value : "id";
}

export function getStoredLocale(): Locale {
  if (typeof window === "undefined") return "id";
  return normalizeLocale(window.localStorage.getItem("untungin_locale"));
}

export function localeTag(locale: Locale) {
  if (locale === "en") return "en-US";
  if (locale === "ms") return "ms-MY";
  return "id-ID";
}

export function useDashboardLocale(): Locale {
  const [locale, setLocale] = useState<Locale>("id");

  useEffect(() => {
    setLocale(getStoredLocale());
    const onLocaleChange = (event: Event) => {
      const customEvent = event as CustomEvent<Locale>;
      setLocale(normalizeLocale(customEvent.detail));
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === "untungin_locale") setLocale(normalizeLocale(event.newValue));
    };
    window.addEventListener(LOCALE_EVENT, onLocaleChange);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(LOCALE_EVENT, onLocaleChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return locale;
}
