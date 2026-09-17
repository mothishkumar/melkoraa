import { Router } from "express";

import { isPublicSupabaseConfigured } from "@/lib/env/public";
import { isServerEnvConfigured } from "@/lib/env/server";

export const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  res.json({
    data: {
      service: "melkoraa",
      api: "v1",
      status: "ok",
      runtime: "express",
      supabasePublicConfigured: isPublicSupabaseConfigured(),
      serverEnvConfigured: isServerEnvConfigured(),
    },
  });
});
