import {
  getPhysicalDeviceApiWarning,
  isPrivateNetworkApiUrl,
  resolveApiUrl,
} from "@/src/config/env";

describe("physical device API configuration", () => {
  it("treats localhost and LAN URLs as private-network targets", () => {
    expect(isPrivateNetworkApiUrl("http://localhost:4317/api/v1")).toBe(true);
    expect(isPrivateNetworkApiUrl("http://192.168.1.20:4317/api/v1")).toBe(true);
    expect(isPrivateNetworkApiUrl("https://www.melkoraa.in/api/v1")).toBe(false);
  });

  it("warns that localhost will not work on physical devices", () => {
    expect(getPhysicalDeviceApiWarning("http://localhost:4317/api/v1")).toContain(
      "localhost API URLs do not work on physical devices",
    );
  });

  it("allows LAN URLs with a same-network reminder", () => {
    expect(getPhysicalDeviceApiWarning("http://192.168.1.20:4317/api/v1")).toContain(
      "same network",
    );
  });

  it("defaults development builds to production API when no override is set", () => {
    expect(resolveApiUrl("development")).toBe("https://www.melkoraa.in/api/v1");
  });

  it("blocks private-network URLs in production builds", () => {
    expect(() =>
      resolveApiUrl("production", "http://192.168.1.20:4317/api/v1"),
    ).toThrow(/Production builds cannot target localhost/);
  });
});
