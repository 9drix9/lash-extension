import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const locale = cookieStore.get("locale")?.value || "en";
  const validLocale = locale === "es" ? "es" : "en";

  return {
    locale: validLocale,
    messages: (await import(`../i18n/messages/${validLocale}.json`)).default,
  };
});
