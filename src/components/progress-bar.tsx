import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  label?: string;
  showPercentage?: boolean;
  className?: string;
}

export function ProgressBar({
  value,
  label,
  showPercentage = false,
  className,
}: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div className={cn("w-full", className)}>
      {/* Label and percentage header */}
      {(label || showPercentage) && (
        <div className="mb-1.5 flex items-center justify-between">
          {label && (
            <span className="text-sm font-medium text-foreground">
              {label}
            </span>
          )}
          {showPercentage && (
            <span className="text-sm font-semibold text-gold">
              {Math.round(clampedValue)}%
            </span>
          )}
        </div>
      )}

      {/* Track */}
      <div
        className={cn(
          "relative h-3 w-full overflow-hidden rounded-full",
          "bg-muted"
        )}
        role="progressbar"
        aria-valuenow={clampedValue}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        {/* Fill */}
        <div
          className={cn(
            "progress-fill h-full rounded-full",
            "bg-gradient-to-r from-gold-dark via-gold to-gold-light"
          )}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
}
