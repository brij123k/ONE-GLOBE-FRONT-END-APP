import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-0 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "border border-cyan-400/30 bg-gradient-to-br from-cyan-400 to-cyan-600 text-black shadow-[0_8px_0_0_rgba(3,87,107,0.55),0_18px_36px_-18px_rgba(0,212,255,0.6)] hover:-translate-y-0.5 hover:shadow-[0_10px_0_0_rgba(3,87,107,0.5),0_24px_44px_-18px_rgba(0,212,255,0.65)]",
        destructive: "border border-red-400/30 bg-gradient-to-br from-red-500 to-red-700 text-white shadow-[0_8px_0_0_rgba(90,10,18,0.55),0_18px_36px_-18px_rgba(255,0,64,0.5)] hover:-translate-y-0.5",
        outline: "border border-cyan-500/20 bg-[#09111d] text-cyan-300 shadow-[0_8px_20px_-18px_rgba(0,0,0,0.95)] hover:border-cyan-400/40 hover:bg-[#0c1624] hover:text-cyan-200 hover:-translate-y-0.5",
        secondary: "border border-white/10 bg-white/5 text-slate-100 shadow-[0_8px_20px_-18px_rgba(0,0,0,0.95)] hover:bg-white/10 hover:-translate-y-0.5",
        ghost: "text-slate-300 hover:bg-white/5 hover:text-white",
        link: "text-cyan-400 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
