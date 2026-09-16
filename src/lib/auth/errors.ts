export const AUTH_MESSAGES = {
  invalidLogin: "Email or password is incorrect.",
  registerFailed: "Unable to create your account. Please try again.",
  resetSent:
    "If an account exists for that email, you'll receive a password reset link.",
  verifySent:
    "If that email can receive a confirmation link, one has been sent.",
  unexpected: "Something went wrong. Please try again.",
  rateLimited: "Too many attempts. Please wait and try again.",
  unverifiedEmail: "Confirm your email before signing in.",
  alreadyVerified: "This email is already confirmed. You can sign in.",
  recoveryMissing: "This reset link is invalid or has expired.",
  passwordUpdated: "Your password has been updated. Sign in to continue.",
  supabaseMissing: "Authentication is not configured.",
  cooldown: "Please wait before requesting another email.",
} as const;

function includesAny(haystack: string, needles: string[]): boolean {
  return needles.some((needle) => haystack.includes(needle));
}

export function mapAuthError(
  error: { message?: string; status?: number; code?: string } | null | undefined,
  fallback: string = AUTH_MESSAGES.unexpected,
): string {
  if (!error) return fallback;

  const status = error.status;
  const code = (error.code ?? "").toLowerCase();
  const message = (error.message ?? "").toLowerCase();

  if (status === 429 || code.includes("over_request") || includesAny(message, ["rate limit", "too many"])) {
    return AUTH_MESSAGES.rateLimited;
  }

  if (
    code === "email_not_confirmed" ||
    includesAny(message, ["email not confirmed", "email_not_confirmed"])
  ) {
    return AUTH_MESSAGES.unverifiedEmail;
  }

  if (
    includesAny(message, [
      "already confirmed",
      "email already confirmed",
      "already been confirmed",
    ])
  ) {
    return AUTH_MESSAGES.alreadyVerified;
  }

  if (
    code === "invalid_credentials" ||
    includesAny(message, ["invalid login", "invalid credentials", "invalid email or password"])
  ) {
    return AUTH_MESSAGES.invalidLogin;
  }

  if (includesAny(message, ["same password", "should be different"])) {
    return "Choose a password you have not used recently.";
  }

  if (includesAny(message, ["password"])) {
    if (includesAny(message, ["weak", "least", "character", "pwned"])) {
      return "That password is not strong enough. Use at least 8 characters with a letter and a number.";
    }
  }

  return fallback;
}

export function fieldErrorsFromZod(
  error: { flatten: () => { fieldErrors: Record<string, string[] | undefined> } },
): Record<string, string> {
  const flattened = error.flatten().fieldErrors;
  const result: Record<string, string> = {};
  for (const [key, messages] of Object.entries(flattened)) {
    const first = messages?.[0];
    if (first) result[key] = first;
  }
  return result;
}
