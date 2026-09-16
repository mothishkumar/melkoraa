import { apiRequest } from "./client";

export type AuthUser = {
  id: string;
  email: string;
  emailConfirmed: boolean;
  role: string;
  firstName: string | null;
  lastName: string | null;
};

export function getMeRequest() {
  return apiRequest<AuthUser>("/api/v1/auth/me");
}

export function loginRequest(input: { email: string; password: string; next?: string }) {
  return apiRequest<{ ok: true; redirectTo: string }>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function registerRequest(input: {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}) {
  return apiRequest<{ ok: true; needsVerification?: boolean; redirectTo?: string }>(
    "/api/v1/auth/register",
    { method: "POST", body: JSON.stringify(input) },
  );
}

export function logoutRequest() {
  return apiRequest<{ ok: true }>("/api/v1/auth/logout", { method: "POST" });
}

export function forgotPasswordRequest(input: { email: string }) {
  return apiRequest<{ ok: true }>("/api/v1/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function resetPasswordRequest(input: { password: string; confirmPassword: string }) {
  return apiRequest<{ ok: true; redirectTo?: string }>("/api/v1/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function resendVerificationRequest(input: { email: string }) {
  return apiRequest<{ ok: true }>("/api/v1/auth/resend-verification", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
