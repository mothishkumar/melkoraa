import { cn } from "@/lib/utils";

export function StatusPill({ value }: { value: string }) {
  const tone =
    value === "active" || value === "paid" || value === "confirmed" || value === "delivered"
      ? "bg-emerald-50 text-emerald-700"
      : value === "pending" || value === "processing" || value === "draft"
        ? "bg-amber-50 text-amber-800"
        : value === "archived" ||
            value === "cancelled" ||
            value === "canceled" ||
            value === "failed" ||
            value === "inactive"
          ? "bg-rose-50 text-rose-700"
          : "bg-zinc-100 text-zinc-700";

  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize", tone)}>
      {value}
    </span>
  );
}
