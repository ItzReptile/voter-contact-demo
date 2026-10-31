import { describe, expect, it } from "vitest";
import { formatPercent, formatPhone, rate } from "./format";

describe("rate and formatPercent", () => {
  it("divides and rounds to a whole percent", () => {
    expect(formatPercent(rate(1, 3))).toBe("33%");
    expect(formatPercent(rate(2, 3))).toBe("67%");
  });

  it("shows a dash instead of dividing by zero", () => {
    expect(rate(0, 0)).toBeNull();
    expect(formatPercent(rate(0, 0))).toBe("—");
  });

  it("shows 0% when there were attempts but no conversations", () => {
    expect(formatPercent(rate(0, 5))).toBe("0%");
  });
});

describe("formatPhone", () => {
  it("formats 10 digits", () => {
    expect(formatPhone("5552345678")).toBe("(555) 234-5678");
  });

  it("shows a dash for no phone", () => {
    expect(formatPhone(null)).toBe("—");
  });
});
