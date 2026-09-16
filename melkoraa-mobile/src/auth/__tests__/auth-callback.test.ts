jest.mock("expo-linking", () => ({
  createURL: (path: string) => `melkoraa://${path}`,
  parse: jest.fn(),
}));

import { mobileAuthRedirect } from "@/src/auth/auth-callback";

describe("mobileAuthRedirect", () => {
  it("creates a melkoraa:// callback URL", () => {
    expect(mobileAuthRedirect("auth/callback")).toMatch(/auth\/callback/);
  });
});
