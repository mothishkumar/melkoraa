import { apiRequest } from "@/src/api/client";

export type HealthDto = {
  service: string;
  api: string;
  status: string;
  supabasePublicConfigured: boolean;
  serverEnvConfigured: boolean;
};

export const healthApi = {
  check() {
    return apiRequest<HealthDto>("/health");
  },
};
