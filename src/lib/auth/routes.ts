export const AUTH_ROUTES = {
  login: "/login",
  register: "/register",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  verifyEmail: "/verify-email",
  unauthorized: "/unauthorized",
  callback: "/auth/callback",
} as const;

export const guestAuthPaths = ["/login", "/register"] as const;
