"use client";

import { useTranslations } from "next-intl";
import { Trophy, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface MilestoneData {
  id: string;
  title: string;
  message: string;
  badgeEmoji: string;
  nextStep: string;
  awardedAt: string;
}

interface AllMilestoneData {
  id: string;
  triggerType: string;
  title: string;
  badgeEmoji: string;
  earned: boolean;
}

interface EnhancedMilestonesProps {
  earnedMilestones: MilestoneData[];
  allMilestones: AllMilestoneData[];
}

const TRIGGER_ORDER = [
  "FIRST_MODULE",
  "FIRST_QUIZ_PASS",
  "QUARTER",
  "HALF",
  "THREE_QUARTER",
  "COURSE_COMPLETE",
];

export function EnhancedMilestones({
  earnedMilestones,
  allMilestones,
}: EnhancedMilestonesProps) {
  const t = useTranslations("dashboard");

  const nextMilestone = TRIGGER_ORDER.map((trigger) =>
    allMilestones.find((m) => m.triggerType === trigger && !m.earned)
  ).find(Boolean);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Trophy className="h-5 w-5 text-gold" />
          {t("milestones")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {earnedMilestones.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {earnedMilestones.map((m) => (
              <div
                key={m.id}
                className="rounded-lg border border-gold/20 bg-gold/5 p-3"
              >
                <div className="text-2xl mb-1">{m.badgeEmoji}</div>
                <p className="font-medium text-sm">{m.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {m.message}
                </p>
                {m.nextStep && (
                  <Badge variant="secondary" className="mt-2 text-xs">
                    {m.nextStep}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Trophy className="h-10 w-10 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">
              {t("noMilestonesYet")}
            </p>
          </div>
        )}

        {nextMilestone && (
          <div className="flex items-center gap-3 rounded-lg border border-dashed border-muted-foreground/30 p-3">
            <span className="text-xl opacity-50">{nextMilestone.badgeEmoji}</span>
            <p className="text-sm text-muted-foreground flex-1">
              {t("nextMilestone", { title: nextMilestone.title })}
            </p>
            <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
