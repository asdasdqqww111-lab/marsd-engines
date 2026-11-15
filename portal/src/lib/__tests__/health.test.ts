import { describe, expect, it } from "vitest";
import { checkAppHealth } from "@/lib/health";

// Note: checkAppHealth performs network I/O. These tests use unset URLs
// (the honest "unknown" path) and invalid URLs, which do not hit the network.

describe("checkAppHealth", () => {
  it("reports unknown when base URL is unset", async () => {
    const r = await checkAppHealth("test", undefined, "/");
    expect(r.status).toBe("unknown");
    expect(r.httpStatus).toBeNull();
  });

  it("reports unknown for malformed base URL", async () => {
    const r = await checkAppHealth("test", "not-a-url", "/");
    expect(r.status).toBe("unknown");
  });

  it("rejects non-HTTP protocols", async () => {
    const r = await checkAppHealth("test", "file:///etc/passwd", "/");
    expect(r.status).toBe("unknown");
    expect(r.detail).toContain("protocol");
  });
});
