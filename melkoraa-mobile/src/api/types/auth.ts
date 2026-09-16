export type AuthMeDto = {
  id: string;
  email: string | null;
  emailConfirmed: boolean;
  role: string;
  firstName: string | null;
  lastName: string | null;
};

export type LogoutResponse = {
  signedOut: boolean;
};
