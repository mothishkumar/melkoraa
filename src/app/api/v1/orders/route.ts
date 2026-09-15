import { requireApiAuth } from "@/lib/auth/api-guard";
import { notImplemented } from "@/server/http";

export async function GET() {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;
  return notImplemented("Order list");
}

export async function POST() {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;
  return notImplemented("Create order");
}
