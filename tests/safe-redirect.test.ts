import { describe, expect, it } from "vitest";
import { safeNextPath } from "@/lib/safe-redirect";

describe("safeNextPath", () => {
  it("garde un chemin interne", () => {
    expect(safeNextPath("/clients?q=a")).toBe("/clients?q=a");
  });
  it.each([
    "//evil.com",
    "/\\evil.com",
    "https://evil.com",
    "evil.com",
    "javascript:alert(1)",
    "",
    "/a\nb",
    "/" + "a".repeat(600),
  ])("refuse %j", (value) => {
    expect(safeNextPath(value)).toBe("/");
  });
  it("refuse les valeurs non textuelles", () => {
    expect(safeNextPath(null)).toBe("/");
    expect(safeNextPath(["/a"])).toBe("/");
    expect(safeNextPath(undefined, "/x")).toBe("/x");
  });
});
