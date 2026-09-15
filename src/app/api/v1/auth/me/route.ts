import { requireApiAuth } from "@/lib/auth/api-guard";

export async function GET() {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  return Response.json({
    data: {
      id: auth.user.id,
      email: auth.user.email,
      emailConfirmed: Boolean(auth.user.email_confirmed_at),
      role: auth.profile.role,
      firstName: auth.profile.firstName,
      lastName: auth.profile.lastName,
    },
  });
}
