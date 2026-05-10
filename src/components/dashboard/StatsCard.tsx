import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
}

export function StatsCard({ icon: Icon, label, value, change, changeType = "neutral" }: StatsCardProps) {
  return (
    <div className="neon-card rounded-2xl p-5">
      <div className="relative z-10 flex items-start justify-between">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/10 border border-cyan-500/20 flex items-center justify-center shadow-[0_12px_24px_-18px_rgba(0,212,255,0.35)]">
          <Icon className="w-5 h-5 text-cyan-300" />
        </div>
        {change && (
          <span
            className={cn(
              "text-xs font-medium px-2 py-1 rounded-full border",
              changeType === "positive" && "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
              changeType === "negative" && "bg-red-500/10 text-red-300 border-red-500/20",
              changeType === "neutral" && "bg-white/5 text-slate-400 border-white/10"
            )}
          >
            {change}
          </span>
        )}
      </div>
      <div className="relative z-10 mt-4">
        <p className="text-2xl font-bold text-slate-50">{value}</p>
        <p className="text-sm text-slate-400 mt-1">{label}</p>
      </div>
    </div>
  );
}
