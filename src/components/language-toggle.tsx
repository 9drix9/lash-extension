"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { setLocale } from "@/lib/actions/locale";

export function LanguageToggle() {
  const t = useTranslations("common");
  const serverLocale = useLocale();
  const [open, setOpen] = useState(false);
  const [currentLocale, setCurrentLocale] = useState(serverLocale);

  useEffect(() => {
    const match = document.cookie.match(/(?:^|;\s*)locale=([^;]*)/);
    if (match) setCurrentLocale(match[1]);
  }, []);

  async function switchLocale(locale: "en" | "es") {
    document.cookie = `locale=${locale};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;
    setOpen(false);
    await setLocale(locale);
    window.location.reload();
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-1.5 text-sm font-medium",
          "hover:text-gold"
        )}
        aria-label={t("language")}
      >
        <Globe className="h-4 w-4" />
        <span className="uppercase">{currentLocale}</span>
      </Button>

      {open && (
        <>
          {/* Backdrop to close dropdown */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div
            className={cn(
              "absolute right-0 top-full z-50 mt-1 min-w-[140px]",
              "rounded-md border bg-popover p-1 shadow-md",
              "animate-fade-in"
            )}
          >
            <button
              onClick={() => switchLocale("en")}
              className={cn(
                "flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm",
                "hover:bg-accent hover:text-accent-foreground",
                "transition-colors",
                currentLocale === "en" && "bg-accent/50 font-medium"
              )}
            >
              <span className="text-base">🇺🇸</span>
              <span>{t("english")}</span>
            </button>
            <button
              onClick={() => switchLocale("es")}
              className={cn(
                "flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm",
                "hover:bg-accent hover:text-accent-foreground",
                "transition-colors",
                currentLocale === "es" && "bg-accent/50 font-medium"
              )}
            >
              <span className="text-base">🇪🇸</span>
              <span>{t("spanish")}</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
