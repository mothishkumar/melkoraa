"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { logoutAction } from "@/features/auth/actions";
import { cn } from "@/lib/utils";

export function LogoutButton({
  className,
  label = "Sign out",
}: {
  className?: string;
  label?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          await logoutAction();
          router.refresh();
        });
      }}
      className={cn(
        "label-caps text-[0.65rem] text-off-white/80 transition-colors hover:text-off-white disabled:opacity-50",
        className,
      )}
    >
      {pending ? "Signing out" : label}
    </button>
  );
}
