import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { verifyCertificate } from "@/lib/actions/certificate";
import { formatDate } from "@/lib/utils";
import { Award, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default async function CertificateVerifyPage({
  params,
}: {
  params: Promise<{ certificateId: string }>;
}) {
  const { certificateId } = await params;
  const t = await getTranslations("certificate");

  const cert = await verifyCertificate(certificateId);

  return (
    <div className="min-h-screen bg-gray-50/50 flex items-center justify-center px-4 py-12">
      <Card className="max-w-lg w-full">
        <CardContent className="p-8 text-center">
          {cert ? (
            <>
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h1 className="text-2xl font-display font-bold mb-2">
                {t("verify")}
              </h1>
              <p className="text-green-600 font-medium mb-6">{t("valid")}</p>

              <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-6 mb-6 text-left space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    {t("issuedTo")}
                  </p>
                  <p className="text-lg font-semibold">{cert.studentName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    {t("courseName")}
                  </p>
                  <p className="font-medium">{cert.courseName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    {t("issuedOn")}
                  </p>
                  <p className="font-medium">{formatDate(cert.issuedAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    {t("certId")}
                  </p>
                  <p className="font-mono text-sm">{cert.certificateCode}</p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Award className="w-4 h-4 text-primary" />
                <span>Lash Extension Academy</span>
              </div>
            </>
          ) : (
            <>
              <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-10 h-10 text-red-500" />
              </div>
              <h1 className="text-2xl font-display font-bold mb-2">
                {t("verify")}
              </h1>
              <p className="text-red-500">{t("invalid")}</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
