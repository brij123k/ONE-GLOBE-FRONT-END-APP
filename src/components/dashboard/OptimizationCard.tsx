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
        "neon-card group relative p-6 cursor-pointer overflow-hidden transition-all duration-300 hover:-translate-y-1",
        gradient
          ? "border-cyan-400/20 text-slate-950"
          : "border-cyan-500/15 text-slate-100",
        comingSoon && "opacity-60 cursor-not-allowed"
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Icon */}
      <div
        className={cn(
          "relative z-10 w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110 border",
          gradient
            ? "bg-slate-950/90 border-slate-900/30 shadow-[0_12px_26px_-16px_rgba(0,0,0,0.65)]"
            : "bg-gradient-to-br from-cyan-500/18 to-purple-500/12 border-cyan-500/20 shadow-[0_12px_26px_-16px_rgba(0,212,255,0.25)]"
        )}
      >
        <Icon
          className={cn(
            "w-6 h-6",
              gradient ? "text-cyan-300" : "text-cyan-300"
          )}
        />
      </div>

      {/* Content */}
      <h3
        className={cn(
          "relative z-10 font-semibold text-lg mb-2",
          gradient ? "text-slate-950" : "text-slate-100"
        )}
      >
        {title}
      </h3>
      <p
        className={cn(
          "relative z-10 text-sm leading-relaxed",
          gradient ? "text-slate-900/80" : "text-slate-400"
        )}
      >
        {description}
      </p>

      {/* Coming Soon Badge */}
      {comingSoon && (
        <div className="absolute top-4 right-4 text-xs font-medium bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 px-2 py-1 rounded-full">
          Coming Soon
        </div>
      )}

      {/* Hover Arrow */}
      {!comingSoon && (
        <div
          className={cn(
            "absolute bottom-6 right-6 w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300 z-10",
            gradient ? "bg-black/10" : "bg-cyan-500/10"
          )}
        >
          <svg
            className={cn("w-4 h-4", gradient ? "text-slate-900" : "text-cyan-300")}
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
