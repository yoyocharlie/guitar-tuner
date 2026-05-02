import { describe, expect, it } from "vitest";
import { getSurfaceState } from "@/features/tuner/components/tuner-workspace";

describe("getSurfaceState", () => {
  it("keeps the live surface visible while the mic is listening", () => {
    expect(getSurfaceState("listening", true)).toBe("listening");
  });

  it("shows idle when the mic is not enabled", () => {
    expect(getSurfaceState("idle", false)).toBe("idle");
  });

  it("preserves blocked states over the live surface", () => {
    expect(getSurfaceState("requesting", true)).toBe("requesting");
    expect(getSurfaceState("denied", true)).toBe("denied");
    expect(getSurfaceState("unsupported", true)).toBe("unsupported");
  });
});
