import { cn } from "@/lib/utils";

interface TextBarProps {
  label: string;
  value: number;
  max?: number;
  showValue?: boolean;
  barLength?: number;
  color?: "red" | "green" | "yellow" | "cyan" | "orange" | "white" | "heat";
  className?: string;
}

/**
 * ASCII-style inline text bar: LABEL [======----] 45/100
 * Using = for filled and - for empty, like classic terminal bars
 */
export function TextBar({
  label,
  value,
  max = 100,
  showValue = true,
  barLength = 10,
  color = "red",
  className,
}: TextBarProps) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));
  const filledBlocks = Math.round((percent / 100) * barLength);
  const emptyBlocks = barLength - filledBlocks;

  // Heat color changes based on value
  const resolvedColor =
    color === "heat"
      ? percent >= 75
        ? "red"
        : percent >= 50
        ? "orange"
        : percent >= 25
        ? "yellow"
        : "green"
      : color;

  const colorClasses: Record<string, string> = {
    red: "text-red-500",
    green: "text-green-400",
    yellow: "text-yellow-400",
    cyan: "text-cyan-400",
    orange: "text-orange-400",
    white: "text-neutral-200",
  };

  const filled = "=".repeat(filledBlocks);
  const empty = "-".repeat(emptyBlocks);

  return (
    <div className={cn("font-mono text-[11px] leading-tight whitespace-nowrap", className)}>
      <span className="text-neutral-500 uppercase w-[52px] inline-block">{label}</span>
      <span className="text-neutral-600">[</span>
      <span className={colorClasses[resolvedColor]}>{filled}</span>
      <span className="text-neutral-700">{empty}</span>
      <span className="text-neutral-600">]</span>
      {showValue && (
        <span className="text-neutral-500 ml-1 tabular-nums">
          {Math.ceil(value)}/{max}
        </span>
      )}
    </div>
  );
}

/**
 * Minimal star display: ★★☆
 */
export function WantedStars({
  stars,
  maxStars = 3,
  className,
}: {
  stars: number;
  maxStars?: number;
  className?: string;
}) {
  return (
    <div className={cn("font-mono text-[11px] leading-tight flex items-center whitespace-nowrap", className)}>
      <span className="text-neutral-500 uppercase w-[52px] inline-block">WANTED</span>
      <span>
        {[...Array(maxStars)].map((_, i) => (
          <span
            key={i}
            className={i < stars ? "text-yellow-400" : "text-neutral-700"}
          >
            ★
          </span>
        ))}
      </span>
    </div>
  );
}
