import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { CheckCircle2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function CheckoutSuccessPage() {
  const t = await getTranslations("payment");

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <CardTitle className="font-display text-2xl">
            {t("checkoutSuccess")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{t("redirecting")}</p>
        </CardContent>
        <CardFooter className="justify-center">
          <Button asChild className="bg-gold hover:bg-gold-dark">
            <Link href="/dashboard">{t("goToDashboard")}</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
