"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  /** "light" = cream logo for dark backgrounds, "colored" = official colours */
  variant?: "dark" | "light" | "colored";
  /** Compact = smaller logo for headers */
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

/** The official TriBloom Farms logo (from /public). */
export function FarmLogo({ className, variant = "colored", size = "md" }: LogoProps) {
  const src = variant === "light" ? "/tribloom-logo-light.png" : "/tribloom-logo.png";
  const width = size === "sm" ? 96 : size === "lg" ? 200 : 132;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="TriBloom Farms"
      width={width}
      height={Math.round(width * 0.712)}
      className={cn("select-none h-auto", className)}
      style={{ width }}
      draggable={false}
    />
  );
}
