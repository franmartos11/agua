"use client";

import { buttonVariants } from "@/components/ui/button";

type Variant = "primary" | "secondary" | "ghost" | "danger";

export function ConfirmSubmitButton({
  label,
  confirmText,
  variant = "danger",
  className,
}: {
  label: string;
  confirmText: string;
  variant?: Variant;
  className?: string;
}) {
  return (
    <button
      type="submit"
      className={buttonVariants({ variant, className })}
      onClick={(e) => {
        if (!confirm(confirmText)) e.preventDefault();
      }}
    >
      {label}
    </button>
  );
}
