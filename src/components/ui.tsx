import type { ReactNode } from "react";
import { IconChevron } from "./Icons";

export function Card({
  children,
  className = "",
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const cls = `rounded-[20px] bg-white card-shadow ${className}`;
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${cls} w-full border-0 p-0 text-left`}>
        {children}
      </button>
    );
  }
  return <section className={cls}>{children}</section>;
}

export function PrimaryButton({
  children,
  onClick,
  type = "button",
  disabled,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`flex w-full items-center justify-center gap-2 rounded-[16px] border-0 bg-fish px-4 py-3.5 text-[15px] font-semibold text-ink disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-[16px] border-0 bg-transparent px-4 py-3 text-[15px] font-medium text-muted"
    >
      {children}
    </button>
  );
}

export function TextLink({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-0.5 border-0 bg-transparent p-0 text-[13px] text-muted"
    >
      {children}
      <IconChevron size={14} className="text-muted" />
    </button>
  );
}

export function IconBadge({
  color,
  children,
}: {
  color: string;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] ${color}`}
    >
      {children}
    </span>
  );
}
