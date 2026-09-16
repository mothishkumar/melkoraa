import { ApiClientError, isAuthRequiredError } from "@/src/api/errors";

describe("isAuthRequiredError", () => {
  it("returns true for 401 ApiClientError", () => {
    const error = new ApiClientError(401, "UNAUTHENTICATED", "Sign in required.");
    expect(isAuthRequiredError(error)).toBe(true);
  });

  it("returns false for other errors", () => {
    const error = new ApiClientError(500, "INTERNAL", "Server error");
    expect(isAuthRequiredError(error)).toBe(false);
  });
});
