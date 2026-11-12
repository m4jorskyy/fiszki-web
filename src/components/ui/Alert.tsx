"use client";

import React from "react";
import { Check } from "lucide-react";

type AlertVariant = "error" | "success" | "info";

interface AlertProps {
  variant?: AlertVariant;
  message: string;
  className?: string;
}

const VARIANT_CLASSES: Record<AlertVariant, string> = {
  error:
    "border-[var(--rule-crimson)] bg-[var(--rule-crimson-soft)] text-[var(--rule-crimson)]",
  success:
    "border-[var(--stamp-verdigris)] bg-[var(--stamp-verdigris-soft)] text-[var(--stamp-verdigris)] font-semibold",
  info: "border-[var(--border-strong)] bg-[var(--accent-purple-soft)] text-[var(--ink-primary)]",
};

export function Alert({
  variant = "info",
  message,
  className = "",
}: AlertProps) {
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={`p-3 rounded border text-sm flex items-center gap-2 ${VARIANT_CLASSES[variant]} ${className}`}
    >
      {variant === "success" && <Check className="w-4 h-4 shrink-0" />}
      <span>{message}</span>
    </div>
  );
}
