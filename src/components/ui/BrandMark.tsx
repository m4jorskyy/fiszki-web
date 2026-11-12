"use client";

import React from "react";

interface BrandMarkProps {
  title: string;
  subtitle?: string;
  compact?: boolean;
}

export function BrandMark({
  title,
  subtitle,
  compact = false,
}: BrandMarkProps) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`${
          compact ? "w-7 h-7 text-base" : "w-8 h-8 text-lg"
        } rounded bg-[var(--ink-primary)] text-[var(--bg-card)] flex items-center justify-center font-serif-card font-semibold`}
      >
        F
      </div>
      <div>
        <span className="font-serif-card font-semibold text-lg tracking-tight block leading-none">
          {title}
        </span>
        {subtitle && (
          <span className="text-xs text-[var(--ink-muted)] block mt-0.5">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}
