import {
  assertProductionApiUrl,
  resolveApiUrl,
  resolveAppEnvironment,
  resolveSiteUrl,
} from "@/src/config/env";

describe("resolveAppEnvironment", () => {
  it("defaults to development", () => {
    expect(resolveAppEnvironment(undefined)).toBe("development");
  });

  it("accepts production", () => {
    expect(resolveAppEnvironment("production")).toBe("production");
  });
});

describe("resolveApiUrl", () => {
  it("uses the production API by default", () => {
    expect(resolveApiUrl("production")).toBe("https://www.melkoraa.in/api/v1");
  });

  it("honors explicit API URLs", () => {
    expect(
      resolveApiUrl("development", "https://staging.example.com/api/v1"),
    ).toBe("https://staging.example.com/api/v1");
  });

  it("rejects private-network URLs in production", () => {
    expect(() =>
      assertProductionApiUrl("http://localhost:4317/api/v1", "production"),
    ).toThrow(/Production builds cannot target localhost/);
  });
});

describe("resolveSiteUrl", () => {
  it("defaults to the public site", () => {
    expect(resolveSiteUrl()).toBe("https://www.melkoraa.in");
  });
});
