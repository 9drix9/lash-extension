import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string, locale: string = "en") {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString(locale === "es" ? "es-ES" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function generateCertificateCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "LASH-";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getLocalizedField(
  obj: any,
  field: string,
  locale: string
): string {
  const localeKey = `${field}${locale === "es" ? "Es" : "En"}`;
  const fallbackKey = `${field}En`;
  const value = obj[localeKey] as string;
  if (value && value.trim()) return value;
  return (obj[fallbackKey] as string) || "";
}
