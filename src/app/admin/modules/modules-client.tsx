"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { updateModule } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ModuleData {
  id: string;
  titleEn: string;
  titleEs: string;
  subtitleEn: string;
  subtitleEs: string;
  descEn: string;
  descEs: string;
  imageUrl: string;
  order: number;
  isBonus: boolean;
  isPremiumOnly: boolean;
  lessonCount: number;
  hasQuiz: boolean;
}

interface ModulesClientProps {
  modules: ModuleData[];
}

export function ModulesClient({ modules }: ModulesClientProps) {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);

  function handleSubmit(moduleId: string, formData: FormData) {
    setEditingId(moduleId);
    startTransition(async () => {
      try {
        await updateModule(moduleId, {
          titleEn: formData.get("titleEn") as string,
          titleEs: formData.get("titleEs") as string,
          subtitleEn: formData.get("subtitleEn") as string,
          subtitleEs: formData.get("subtitleEs") as string,
          descEn: formData.get("descEn") as string,
          descEs: formData.get("descEs") as string,
          imageUrl: formData.get("imageUrl") as string,
          isPremiumOnly: formData.get("isPremiumOnly") === "on",
        });
        toast.success(tc("success"));
      } catch {
        toast.error(tc("error"));
      } finally {
        setEditingId(null);
      }
    });
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {modules.map((mod) => (
        <Card key={mod.id} className="flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Badge variant={mod.isBonus ? "secondary" : "default"}>
                  {mod.isBonus ? t("bonusLabel") : `#${mod.order}`}
                </Badge>
                {mod.isPremiumOnly && (
                  <Badge className="bg-gold text-white hover:bg-gold text-xs">VIP</Badge>
                )}
              </div>
              <div className="flex gap-1.5">
                <Badge variant="outline">{t("lessonCount", { count: mod.lessonCount })}</Badge>
                {mod.hasQuiz && <Badge variant="outline">{t("quizHeader")}</Badge>}
              </div>
            </div>
            <CardTitle className="mt-2 text-lg">{mod.titleEn}</CardTitle>
            {mod.titleEs && (
              <CardDescription className="text-xs">
                {t("esLabel")}: {mod.titleEs}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="flex-1">
            {mod.subtitleEn && (
              <p className="mb-1 text-sm text-muted-foreground">
                {mod.subtitleEn}
              </p>
            )}
            {mod.descEn && (
              <p className="line-clamp-2 text-xs text-muted-foreground">
                {mod.descEn}
              </p>
            )}
          </CardContent>
          <CardFooter>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full">
                  {tc("edit")}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>{t("editModule")}</DialogTitle>
                  <DialogDescription>
                    {t("moduleLabel", { order: mod.order, name: mod.titleEn })}
                  </DialogDescription>
                </DialogHeader>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSubmit(mod.id, new FormData(e.currentTarget));
                  }}
                  className="space-y-4"
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor={`titleEn-${mod.id}`}>{t("titleEn")}</Label>
                      <Input
                        id={`titleEn-${mod.id}`}
                        name="titleEn"
                        defaultValue={mod.titleEn}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`titleEs-${mod.id}`}>{t("titleEs")}</Label>
                      <Input
                        id={`titleEs-${mod.id}`}
                        name="titleEs"
                        defaultValue={mod.titleEs}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor={`subtitleEn-${mod.id}`}>
                        {t("subtitleEn")}
                      </Label>
                      <Input
                        id={`subtitleEn-${mod.id}`}
                        name="subtitleEn"
                        defaultValue={mod.subtitleEn}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`subtitleEs-${mod.id}`}>
                        {t("subtitleEs")}
                      </Label>
                      <Input
                        id={`subtitleEs-${mod.id}`}
                        name="subtitleEs"
                        defaultValue={mod.subtitleEs}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`descEn-${mod.id}`}>
                      {t("descriptionEn")}
                    </Label>
                    <textarea
                      id={`descEn-${mod.id}`}
                      name="descEn"
                      defaultValue={mod.descEn}
                      rows={3}
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`descEs-${mod.id}`}>
                      {t("descriptionEs")}
                    </Label>
                    <textarea
                      id={`descEs-${mod.id}`}
                      name="descEs"
                      defaultValue={mod.descEs}
                      rows={3}
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`imageUrl-${mod.id}`}>{t("imageUrlLabel")}</Label>
                    <Input
                      id={`imageUrl-${mod.id}`}
                      name="imageUrl"
                      defaultValue={mod.imageUrl}
                      placeholder="https://..."
                    />
                  </div>

                  <div className="flex items-center gap-2 rounded-lg border border-gold/30 bg-gold/5 p-3">
                    <input
                      type="checkbox"
                      id={`isPremiumOnly-${mod.id}`}
                      name="isPremiumOnly"
                      defaultChecked={mod.isPremiumOnly}
                      className="h-4 w-4 rounded border-gold accent-gold"
                    />
                    <Label htmlFor={`isPremiumOnly-${mod.id}`} className="cursor-pointer text-sm font-medium">
                      VIP Masterclass only (locks this module for Basic & Standard tier users)
                    </Label>
                  </div>

                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="outline">
                        {tc("cancel")}
                      </Button>
                    </DialogClose>
                    <Button
                      type="submit"
                      disabled={isPending && editingId === mod.id}
                    >
                      {isPending && editingId === mod.id
                        ? tc("loading")
                        : tc("save")}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
