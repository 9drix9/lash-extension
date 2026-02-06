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
              <Badge variant={mod.isBonus ? "secondary" : "default"}>
                {mod.isBonus ? "Bonus" : `#${mod.order}`}
              </Badge>
              <div className="flex gap-1.5">
                <Badge variant="outline">{mod.lessonCount} lessons</Badge>
                {mod.hasQuiz && <Badge variant="outline">Quiz</Badge>}
              </div>
            </div>
            <CardTitle className="mt-2 text-lg">{mod.titleEn}</CardTitle>
            {mod.titleEs && (
              <CardDescription className="text-xs">
                ES: {mod.titleEs}
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
                    Module #{mod.order}: {mod.titleEn}
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
                      <Label htmlFor={`titleEn-${mod.id}`}>Title (EN)</Label>
                      <Input
                        id={`titleEn-${mod.id}`}
                        name="titleEn"
                        defaultValue={mod.titleEn}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`titleEs-${mod.id}`}>Title (ES)</Label>
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
                        Subtitle (EN)
                      </Label>
                      <Input
                        id={`subtitleEn-${mod.id}`}
                        name="subtitleEn"
                        defaultValue={mod.subtitleEn}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`subtitleEs-${mod.id}`}>
                        Subtitle (ES)
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
                      Description (EN)
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
                      Description (ES)
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
                    <Label htmlFor={`imageUrl-${mod.id}`}>Image URL</Label>
                    <Input
                      id={`imageUrl-${mod.id}`}
                      name="imageUrl"
                      defaultValue={mod.imageUrl}
                      placeholder="https://..."
                    />
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
