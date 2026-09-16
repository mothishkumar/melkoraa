import { apiRequest } from "@/src/api/client";
import type { AuthMeDto, LogoutResponse } from "@/src/api/types/auth";

export const authApi = {
  me() {
    return apiRequest<AuthMeDto>("/auth/me", { authenticated: true });
  },

  logout() {
    return apiRequest<LogoutResponse>("/auth/logout", {
      method: "POST",
      authenticated: true,
    });
  },
};
