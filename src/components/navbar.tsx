"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Menu, X, User, LogOut, Shield, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LanguageToggle } from "@/components/language-toggle";

export function Navbar({ isPaid }: { isPaid: boolean }) {
  const t = useTranslations("common");
  const { data: session, status } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);

  const isAdmin = session?.user?.role === "ADMIN";

  const navLinks = isPaid
    ? [
        { href: "/dashboard", label: t("dashboard") },
        { href: "/live", label: t("liveQA") },
      ]
    : [{ href: "/enroll", label: t("enroll") }];

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <div className="flex flex-1 items-center">
            <Link
              href="/"
              className="flex items-center gap-2 transition-opacity hover:opacity-80"
            >
              <span className="font-display text-xl font-bold text-gold">
                {t("appName")}
              </span>
            </Link>
          </div>

          {/* Desktop nav links */}
          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium",
                  "text-muted-foreground transition-colors",
                  "hover:bg-accent hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side: language toggle + user */}
          <div className="hidden flex-1 items-center justify-end gap-2 md:flex">
            <LanguageToggle />

            {status === "loading" ? (
              <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
            ) : session?.user ? (
              <div className="relative">
                <button
                  onClick={() => setAvatarMenuOpen(!avatarMenuOpen)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full p-1",
                    "transition-colors hover:bg-accent"
                  )}
                >
                  {session.user.image ? (
                    <img
                      src={session.user.image}
                      alt=""
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/20 text-gold">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </button>

                {avatarMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setAvatarMenuOpen(false)}
                    />
                    <div
                      className={cn(
                        "absolute right-0 top-full z-50 mt-2 min-w-[180px]",
                        "rounded-md border bg-popover p-1 shadow-md",
                        "animate-fade-in"
                      )}
                    >
                      <div className="border-b px-3 py-2">
                        <p className="text-sm font-medium">
                          {session.user.name || session.user.email}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {session.user.email}
                        </p>
                      </div>

                      {isAdmin && (
                        <Link
                          href="/admin"
                          onClick={() => setAvatarMenuOpen(false)}
                          className={cn(
                            "flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm",
                            "hover:bg-accent hover:text-accent-foreground",
                            "transition-colors"
                          )}
                        >
                          <Shield className="h-4 w-4" />
                          {t("admin")}
                        </Link>
                      )}

                      <button
                        onClick={() => {
                          setAvatarMenuOpen(false);
                          signOut();
                        }}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm",
                          "hover:bg-accent hover:text-accent-foreground",
                          "transition-colors text-destructive"
                        )}
                      >
                        <LogOut className="h-4 w-4" />
                        {t("signOut")}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Button
                size="sm"
                onClick={() => signIn()}
                className="bg-gold text-white hover:bg-gold-dark"
              >
                {t("signIn")}
              </Button>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="inline-flex items-center justify-center rounded-md p-2 text-foreground md:hidden"
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </header>

      {/* Mobile drawer — rendered OUTSIDE <header> so it escapes the stacking context */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[999] md:hidden" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />

          {/* Drawer panel */}
          <div
            className={cn(
              "absolute right-0 top-0 h-full w-72",
              "bg-background shadow-xl",
              "flex flex-col overflow-y-auto",
              "animate-fade-in"
            )}
          >
            {/* Close button */}
            <div className="flex items-center justify-between border-b px-4 py-4">
              <span className="font-display text-lg font-bold text-gold">
                {t("appName")}
              </span>
              <button
                onClick={() => setMobileOpen(false)}
                className="rounded-md p-1 hover:bg-accent"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Mobile nav links */}
            <nav className="flex flex-col gap-1 p-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "rounded-md px-3 py-2.5 text-sm font-medium",
                    "text-foreground transition-colors",
                    "hover:bg-accent"
                  )}
                >
                  {link.label}
                </Link>
              ))}

              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium",
                    "text-foreground transition-colors",
                    "hover:bg-accent"
                  )}
                >
                  <Shield className="h-4 w-4" />
                  {t("admin")}
                </Link>
              )}
            </nav>

            {/* Mobile bottom: language + auth */}
            <div className="mt-auto border-t p-4">
              <div className="mb-3">
                <LanguageToggle />
              </div>

              {session?.user ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 px-1">
                    {session.user.image ? (
                      <img
                        src={session.user.image}
                        alt=""
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/20 text-gold">
                        <User className="h-4 w-4" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {session.user.name || session.user.email}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => signOut()}
                    className="w-full justify-start gap-2 text-destructive"
                  >
                    <LogOut className="h-4 w-4" />
                    {t("signOut")}
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  onClick={() => signIn()}
                  className="w-full bg-gold text-white hover:bg-gold-dark"
                >
                  {t("signIn")}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
