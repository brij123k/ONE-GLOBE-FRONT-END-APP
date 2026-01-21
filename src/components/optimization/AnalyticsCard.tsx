import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface AnalyticsCardProps {
  icon: LucideIcon;
  title: string;
  value: number;
  maxValue?: number;
  suffix?: string;
  description?: string;
  variant?: "default" | "success" | "warning" | "error";
}

export function AnalyticsCard({
  icon: Icon,
  title,
  value,
  maxValue = 100,
  suffix = "%",
  description,
  variant = "default",
}: AnalyticsCardProps) {
  const percentage = (value / maxValue) * 100;
  
  const variantStyles = {
    default: "text-primary",
    success: "text-success",
    warning: "text-warning",
    error: "text-destructive",
  };

  const progressVariants = {
    default: "[&>div]:bg-primary",
    success: "[&>div]:bg-success",
    warning: "[&>div]:bg-warning",
    error: "[&>div]:bg-destructive",
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-card">
      <div className="flex items-center gap-3 mb-4">
        <div className={cn("w-9 h-9 rounded-lg bg-gradient-ai-soft flex items-center justify-center")}>
          <Icon className={cn("w-4 h-4", variantStyles[variant])} />
        </div>
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
      </div>
      <div className="flex items-baseline gap-1 mb-3">
        <span className={cn("text-3xl font-bold", variantStyles[variant])}>
          {value}
        </span>
        <span className="text-lg text-muted-foreground">{suffix}</span>
      </div>
      <Progress 
        value={percentage} 
        className={cn("h-2", progressVariants[variant])} 
      />
      {description && (
        <p className="text-xs text-muted-foreground mt-2">{description}</p>
      )}
    </div>
  );
}
