import { useNavigate } from "react-router-dom";

import { useAuth } from "@/contexts/auth-context";

export function LogoutButton() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <button
      type="button"
      className="label-caps text-[0.62rem] text-off-white/80 hover:text-off-white"
      onClick={async () => {
        await signOut();
        navigate("/");
      }}
    >
      Logout
    </button>
  );
}
