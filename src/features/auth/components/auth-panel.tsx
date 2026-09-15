import type { ReactNode } from "react";

export function AuthPanel({
  kicker,
  title,
  children,
}: {
  kicker: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="w-full max-w-md">
      <p className="label-caps">{kicker}</p>
      <h1 className="editorial-display mt-4 text-4xl">{title}</h1>
      <p className="mt-3 text-[0.7rem] tracking-[0.22em] uppercase text-stone">
        BUILD YOUR OWN IDENTITY.
      </p>
      {children}
    </div>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm text-stone">{message}</p>;
}

export function FormNotice({
  message,
  tone = "muted",
}: {
  message: string | null;
  tone?: "muted" | "ok" | "error";
}) {
  if (!message) return null;
  const color =
    tone === "ok" ? "text-off-white" : tone === "error" ? "text-stone" : "text-stone";
  return <p className={`mt-6 text-sm leading-6 ${color}`}>{message}</p>;
}
