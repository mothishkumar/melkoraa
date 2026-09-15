import { isPublicSupabaseConfigured } from "@/lib/env/public";
import { isServerEnvConfigured } from "@/lib/env/server";

export async function GET() {
  return Response.json({
    data: {
      service: "melkoraa",
      api: "v1",
      status: "ok",
      supabasePublicConfigured: isPublicSupabaseConfigured(),
      serverEnvConfigured: isServerEnvConfigured(),
    },
  });
}
