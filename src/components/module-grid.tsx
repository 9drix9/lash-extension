"use client";

import { cn } from "@/lib/utils";
import { ModuleTile } from "@/components/module-tile";

export interface ModuleData {
  id: string;
  title: string;
  subtitle: string;
  imageUrl?: string | null;
  order: number;
  isBonus: boolean;
  isPremiumOnly?: boolean;
  status: "LOCKED" | "UNLOCKED" | "COMPLETED";
  quizPassed: boolean;
  isVipLocked?: boolean;
}

interface ModuleGridProps {
  modules: ModuleData[];
  className?: string;
}

export function ModuleGrid({ modules, className }: ModuleGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3",
        className
      )}
    >
      {modules.map((mod, index) => (
        <div
          key={mod.id}
          className="stagger-item"
          style={{ animationDelay: `${0.05 * (index + 1)}s` }}
        >
          <ModuleTile
            module={{
              id: mod.id,
              title: mod.title,
              subtitle: mod.subtitle,
              imageUrl: mod.imageUrl,
              order: mod.order,
              isBonus: mod.isBonus,
              isPremiumOnly: mod.isPremiumOnly,
            }}
            status={mod.status}
            quizPassed={mod.quizPassed}
            isVipLocked={mod.isVipLocked}
          />
        </div>
      ))}
    </div>
  );
}
