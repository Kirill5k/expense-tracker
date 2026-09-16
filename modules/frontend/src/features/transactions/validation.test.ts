import { describe, expect, it } from "vitest";
import { noteSchema, parseAmount, parseTags, resolvedTags, tagsSchema } from "./validation";
describe("single transaction entry", () => {
  it("accepts one positive amount with at most two decimal places", () => {
    expect(parseAmount(" 12.50 ")).toEqual(12.5);
    expect(parseAmount("0.01")).toEqual(0.01);
    expect(parseAmount("8")).toEqual(8);
  });
  it.each(["", "0", "-1", "1.234", "10,", "12.50, 8", "12;8", "12\n8", "1e5"])(
    "rejects invalid or multiple amounts %s",
    (input) => {
      expect(() => parseAmount(input)).toThrow();
    },
  );
  it("normalizes and deduplicates tags while keeping multiple words together", () => {
    expect(parseTags("Food, food, work trip")).toEqual(["food", "work trip"]);
  });
  it("preserves unchanged legacy metadata on unrelated edits", () => {
    const tags = ["Work Trip", "one", "two", "three", "four"];
    expect(resolvedTags(tags.join(", "), tags)).toEqual(tags);
    expect(tagsSchema(tags).safeParse(tags.join(", ")).success).toBe(true);
    const note = "A legacy note that is longer than thirty characters";
    expect(noteSchema(note).safeParse(note).success).toBe(true);
    expect(noteSchema(note).safeParse(note + " changed").success).toBe(false);
  });
});
