"use client";

import { useTranslations } from "next-intl";
import {
  ClipboardCheck,
  FileText,
  HeartPulse,
  ShoppingBag,
  Download,
  FolderOpen,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const resources = [
  { key: "sanitation", icon: ClipboardCheck, href: "#" },
  { key: "consent", icon: FileText, href: "#" },
  { key: "aftercare", icon: HeartPulse, href: "#" },
  { key: "supplies", icon: ShoppingBag, href: "#" },
] as const;

export function ResourcesVault() {
  const t = useTranslations("dashboard");

  return (
    <div id="resources-vault">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <FolderOpen className="h-5 w-5 text-gold" />
        {t("resourcesVault")}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {resources.map((res) => (
          <Card
            key={res.key}
            className="border-l-4 border-l-gold/40 hover:shadow-md transition-shadow"
          >
            <CardContent className="pt-5 pb-4 space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10">
                <res.icon className="h-5 w-5 text-gold" />
              </div>
              <div>
                <p className="font-medium text-sm">
                  {t(`${res.key}Title` as any)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t(`${res.key}Desc` as any)}
                </p>
              </div>
              <Button variant="outline" size="sm" className="w-full gap-2" asChild>
                <a href={res.href}>
                  <Download className="h-3.5 w-3.5" />
                  {t("downloadResource")}
                </a>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
