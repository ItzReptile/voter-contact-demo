import { describe, expect, it } from "vitest";
import { formatDay, niceScale, sparklinePath } from "./chart";

describe("niceScale", () => {
  it("rounds the top up to a 1, 2 or 5 step", () => {
    expect(niceScale(37)).toEqual({ top: 40, ticks: [0, 10, 20, 30, 40] });
    expect(niceScale(7)).toEqual({ top: 8, ticks: [0, 2, 4, 6, 8] });
    expect(niceScale(180)).toEqual({ top: 200, ticks: [0, 50, 100, 150, 200] });
  });

  it("still draws an axis when everything is zero", () => {
    expect(niceScale(0)).toEqual({ top: 4, ticks: [0, 1, 2, 3, 4] });
  });
});

describe("formatDay", () => {
  it("formats a calendar date without shifting it a day", () => {
    expect(formatDay("2026-10-31")).toBe("Oct 31");
    expect(formatDay("2026-11-01")).toBe("Nov 1");
  });
});

describe("sparklinePath", () => {
  it("scales values into the box, top is the max", () => {
    expect(sparklinePath([0, 5, 10], 100, 20)).toBe("M0.00 20.00 L50.00 10.00 L100.00 0.00");
  });

  it("returns nothing for no data", () => {
    expect(sparklinePath([], 100, 20)).toBe("");
  });
});
