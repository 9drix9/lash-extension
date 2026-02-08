"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations("landing");
  const tCommon = useTranslations("common");

  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-8 sm:flex-row sm:justify-between">
          <div>
            <Link
              href="/"
              className="font-display text-lg font-bold text-gold transition-opacity hover:opacity-80"
            >
              {tCommon("appName")}
            </Link>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("footerDesc")}
            </p>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <Link
              href="/enroll"
              className="transition-colors hover:text-foreground"
            >
              {tCommon("enroll")}
            </Link>
            <Link
              href="/dashboard"
              className="transition-colors hover:text-foreground"
            >
              {tCommon("dashboard")}
            </Link>
            <Link
              href="/live"
              className="transition-colors hover:text-foreground"
            >
              {tCommon("liveQA")}
            </Link>
            <Link
              href="/affiliate"
              className="transition-colors hover:text-foreground"
            >
              {tCommon("affiliate")}
            </Link>
          </nav>
        </div>

        <div className="mt-8 border-t pt-8 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} {t("footerCopyright")}
        </div>
      </div>
    </footer>
  );
}
