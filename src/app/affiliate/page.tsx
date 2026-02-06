import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { AffiliateClient } from "./affiliate-client";
import { getAffiliateStats } from "@/lib/actions/affiliate";
import {
  Gift,
  Link2,
  BarChart3,
  DollarSign,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default async function AffiliatePage() {
  const session = await auth();
  const t = await getTranslations("affiliatePublic");

  const stats = session?.user ? await getAffiliateStats() : null;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Gift className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-display font-bold mb-3">
            {t("title")}
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            {t("desc")}
          </p>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
          {[
            { icon: DollarSign, text: t("benefit1") },
            { icon: Link2, text: t("benefit2") },
            { icon: BarChart3, text: t("benefit3") },
            { icon: Gift, text: t("benefit4") },
          ].map((item, i) => (
            <Card key={i}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <p className="font-medium text-sm">{item.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Affiliate Dashboard or Apply */}
        <AffiliateClient
          isLoggedIn={!!session?.user}
          stats={stats}
        />
      </div>
    </div>
  );
}
