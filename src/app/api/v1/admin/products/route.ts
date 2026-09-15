import { requireApiStaff } from "@/lib/auth/api-guard";
import { notImplemented } from "@/server/http";

export async function GET() {
  const auth = await requireApiStaff();
  if (!auth.ok) return auth.response;
  return notImplemented("Admin products");
}

export async function POST() {
  const auth = await requireApiStaff();
  if (!auth.ok) return auth.response;
  return notImplemented("Create admin product");
}
