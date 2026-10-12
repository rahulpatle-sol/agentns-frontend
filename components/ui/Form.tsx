import type { ComponentProps, ReactNode } from "react";
import { useId } from "react";
import { Loader2 } from "lucide-react";

export function PageHeader({ eyebrow, title, lede }: { eyebrow?: string; title: string; lede?: string }) {
  return (
    <header className="mb-10">
      {eyebrow && <p className="mb-3 text-xs font-medium uppercase tracking-widest text-accent">{eyebrow}</p>}
      <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">{title}</h1>
      {lede && <p className="mt-4 max-w-2xl text-pretty text-base leading-relaxed text-muted">{lede}</p>}
    </header>
  );
}

export function Field({
  label,
  hint,
  error,
  required,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: (p: { id: string; invalid: boolean }) => ReactNode;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-fg/80">
        {label} {required && <span className="text-accent">*</span>}
      </label>
      {children({ id, invalid: !!error })}
      {error ? (
        <p className="mt-1.5 text-xs text-bad">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border bg-fg/[0.03] px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-muted/60 focus:border-accent/60 focus:bg-fg/[0.05] focus:ring-2 focus:ring-accent/20";

export function Input({ invalid, className, ...props }: ComponentProps<"input"> & { invalid?: boolean }) {
  return <input {...props} aria-invalid={invalid} className={`${inputCls} ${invalid ? "border-bad/60" : "border-line"} ${className ?? ""}`} />;
}

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <select {...props} className={`${inputCls} border-line ${className ?? ""}`}>
      {children}
    </select>
  );
}

export function Button({
  variant = "primary",
  loading,
  className,
  children,
  disabled,
  ...props
}: ComponentProps<"button"> & { variant?: "primary" | "ghost" | "danger"; loading?: boolean }) {
  const styles = {
    primary: "btn-primary",
    ghost: "border border-line bg-fg/[0.03] text-fg hover:border-line-strong hover:bg-fg/[0.06]",
    danger: "border border-bad/40 bg-bad/10 text-bad hover:bg-bad/20",
  }[variant];
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50 ${styles} ${className ?? ""}`}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

export function Alert({ tone = "info", title, children }: { tone?: "info" | "warning" | "error"; title: string; children?: ReactNode }) {
  const cls = {
    info: "border-accent-2/30 bg-accent-2/10 text-accent-2",
    warning: "border-warn/30 bg-warn/10 text-warn",
    error: "border-bad/30 bg-bad/10 text-bad",
  }[tone];
  return (
    <div role="alert" className={`rounded-xl border px-4 py-3 text-sm ${cls}`}>
      <p className="font-medium">{title}</p>
      {children && <div className="mt-1 text-xs opacity-90">{children}</div>}
    </div>
  );
}
