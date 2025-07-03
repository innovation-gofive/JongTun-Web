import { cn } from "@/lib/utils";
import { ReactNode } from "react";

// Base glass utility class that can be used with className prop
export const glassClasses = {
  // Primary glass effect - the main Apple iOS 18/26 Liquid Glass style
  primary:
    "backdrop-blur-3xl rounded-[32px] border border-white/[0.1] bg-white/[0.03] shadow-[0_8px_32px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.15)] [backdrop-filter:blur(40px)_saturate(120%)_brightness(105%)]",

  // Secondary glass effect - for smaller elements like buttons and cards
  secondary:
    "backdrop-blur-xl rounded-[32px] border border-white/[0.08] bg-white/[0.05] shadow-[0_4px_16px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.12)] [backdrop-filter:blur(24px)_saturate(115%)_brightness(102%)]",

  // Subtle glass effect - for less prominent elements
  subtle:
    "backdrop-blur-lg rounded-[32px] border border-white/[0.05] bg-white/[0.02] shadow-[0_2px_8px_rgba(0,0,0,0.02),inset_0_1px_0_rgba(255,255,255,0.08)] [backdrop-filter:blur(16px)_saturate(110%)_brightness(101%)]",

  // Text colors optimized for glass backgrounds - lighter/whiter for better visibility
  text: {
    primary: "text-white/95",
    secondary: "text-white/85",
    muted: "text-white/75",
  },
};

// Glass Container Component - reusable glass container with various styles
interface GlassContainerProps {
  children: ReactNode;
  variant?: "primary" | "secondary" | "subtle";
  className?: string;
  padding?: "none" | "sm" | "md" | "lg" | "xl";
}

export function GlassContainer({
  children,
  variant = "secondary",
  className = "",
  padding = "lg",
}: GlassContainerProps) {
  const paddingClasses = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
    xl: "p-12",
  };

  return (
    <div
      className={cn(glassClasses[variant], paddingClasses[padding], className)}
    >
      {children}
    </div>
  );
}

// Glass Card Component - for content cards with title and body
interface GlassCardProps {
  title: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "subtle";
  className?: string;
}

export function GlassCard({
  title,
  children,
  variant = "secondary",
  className = "",
}: GlassCardProps) {
  return (
    <GlassContainer variant={variant} className={className}>
      <h2 className={cn("text-2xl font-bold mb-4", glassClasses.text.primary)}>
        {title}
      </h2>
      <div className={cn("leading-relaxed", glassClasses.text.secondary)}>
        {children}
      </div>
    </GlassContainer>
  );
}

// Glass Button Component - for buttons with glass effect
interface GlassButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "subtle";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function GlassButton({
  children,
  onClick,
  disabled = false,
  variant = "secondary",
  size = "md",
  className = "",
}: GlassButtonProps) {
  const sizeClasses = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
    xl: "px-12 py-6 text-xl",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        glassClasses[variant],
        sizeClasses[size],
        glassClasses.text.primary,
        "font-bold transition-all duration-300 hover:scale-105 active:scale-95",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
        className
      )}
    >
      {children}
    </button>
  );
}
