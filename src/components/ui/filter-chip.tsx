import * as React from "react";
import { cn } from "@/lib/utils";

interface FilterChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  children: React.ReactNode;
}

const FilterChip = React.forwardRef<HTMLButtonElement, FilterChipProps>(
  ({ className, selected = false, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          // Base styles
          "inline-flex items-center justify-center",
          "min-h-[40px] px-4",
          "text-sm font-medium leading-normal",
          "rounded-full border-[1.5px]",
          "transition-all duration-200 ease-out",
          "select-none cursor-pointer",
          // Touch target
          "touch-manipulation",
          // States
          selected
            ? [
                // Active/Selected state
                "bg-primary border-primary/80",
                "text-primary-foreground",
                "shadow-[0_2px_4px_hsl(var(--primary)/0.25)]",
                // Active hover
                "hover:bg-primary/90",
              ]
            : [
                // Inactive state
                "bg-background border-border",
                "text-foreground",
                "shadow-[0_1px_3px_rgba(0,0,0,0.08)]",
                // Inactive hover (desktop)
                "hover:border-primary hover:bg-primary/5",
                "hover:scale-[1.02]",
              ],
          // Pressed state (mobile)
          "active:scale-[0.97]",
          selected 
            ? "active:bg-primary/80" 
            : "active:bg-muted",
          // Focus
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

FilterChip.displayName = "FilterChip";

export { FilterChip };
