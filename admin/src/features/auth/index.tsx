import { useNavigate } from "react-router-dom";

import { useAuth } from "@/contexts/auth-context";

export function LogoutButton({ className }: { className?: string }) {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <button
      type="button"
      className={className ?? "text-xs uppercase tracking-[0.14em] text-zinc-600 hover:text-zinc-900"}
      onClick={async () => {
        await signOut();
        navigate("/login", { replace: true });
      }}
    >
      Logout
    </button>
  );
}
