import { describe, expect, it } from "vitest";
import { formatMoney, toMinor } from "./money";
describe("API money precision", () => {
  it("adds decimal amounts exactly in integer hundredths", () => {
    expect(toMinor("0.10") + toMinor("0.20")).toBe(30);
    expect(toMinor("19.99")).toBe(1999);
    expect(toMinor(-12.34)).toBe(-1234);
  });
  it.each(["0.001", "1e6", "NaN", "9,999", "", "900719925474099.99"])(
    "rejects ambiguous or unsafe amount %s",
    (value) => {
      expect(() => toMinor(value)).toThrow();
    },
  );
  it("keeps backend two-decimal semantics even for JPY", () => {
    expect(formatMoney(12345, "JPY")).toContain("123.45");
  });
});
