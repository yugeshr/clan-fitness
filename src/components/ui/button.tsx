import { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger";
};

const VARIANT_CLASSES: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "bg-accent text-accent-foreground",
  secondary: "bg-surface text-foreground border border-surface-border",
  danger: "bg-danger text-white",
};

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  return (
    <button
      className={`rounded-none px-5 py-2.5 text-sm font-bold tracking-tight shadow-[4px_4px_0_0_var(--edge)] transition-[transform,box-shadow] duration-100 ease-out active:translate-x-1 active:translate-y-1 active:shadow-none disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  );
}
