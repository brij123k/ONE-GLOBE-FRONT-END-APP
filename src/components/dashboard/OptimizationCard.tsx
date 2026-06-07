import { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface OptimizationCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  path: string;
  gradient?: boolean;
  comingSoon?: boolean;
}

export function OptimizationCard({
  icon: Icon,
  title,
  description,
  path,
  gradient,
  comingSoon,
}: OptimizationCardProps) {
  const CardContent = () => (
    <div
      className={cn(
        "group relative p-6 rounded-2xl border transition-smooth cursor-pointer overflow-hidden",
        gradient
          ? "bg-[#95BF46] border-transparent text-white hover:shadow-card-hover"
          : "bg-card border-border hover:border-primary/30 hover:shadow-card-hover",
        comingSoon && "opacity-60 cursor-not-allowed"
      )}
    >
      {/* Background decoration */}
      {gradient && (
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      )}

      {/* Icon */}
      <div
        className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-smooth group-hover:scale-110",
          gradient
            ? "bg-white"
            : "bg-gradient-ai-soft"
        )}
      >
        <Icon
          className={cn(
            "w-6 h-6",
              gradient ? "text-[#95BF46]" : "text-[#95BF46]"
          )}
        />
      </div>

      {/* Content */}
      <h3
        className={cn(
          "font-semibold text-lg mb-2",
          gradient ? "text-primary-foreground" : "text-foreground"
        )}
      >
        {title}
      </h3>
      <p
        className={cn(
          "text-sm leading-relaxed",
          gradient ? "text-primary-foreground/80" : "text-muted-foreground"
        )}
      >
        {description}
      </p>

      {/* Coming Soon Badge */}
      {comingSoon && (
        <div className="absolute top-4 right-4 text-xs font-medium bg-white text-[#95BF46] px-2 py-1 rounded-full">
          Coming Soon
        </div>
      )}

      {/* Hover Arrow */}
      {!comingSoon && (
        <div
          className={cn(
            "absolute bottom-6 right-6 w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-smooth",
            gradient ? "bg-white/20" : "bg-primary/10"
          )}
        >
          <svg
            className={cn("w-4 h-4", gradient ? "text-primary-foreground" : "text-primary")}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      )}
    </div>
  );

  if (comingSoon) {
    return <CardContent />;
  }

  return (
    <Link to={path}>
      <CardContent />
    </Link>
  );
}
