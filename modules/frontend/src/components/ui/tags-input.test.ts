import { describe, expect, it } from "vitest";
import { editTagsInput, readTagsInput, removeTagInput } from "./tags-input";
import { resolvedTags, tagsSchema } from "@/features/transactions/validation";

describe("tag input values", () => {
  it("preserves untouched legacy tag spelling and case", () => {
    const original = ["Food", "Work Trip", "  legacy  "];
    const state = readTagsInput(original.join(", "));
    expect(state.tags).toEqual(["Food", "Work Trip", "legacy"]);
    expect(resolvedTags(state.value, original)).toEqual(original);
  });

  it("includes an uncommitted draft in the value submitted by a form", () => {
    const state = editTagsInput(readTagsInput("home"), "work trip");
    expect(state.tags).toEqual(["home"]);
    expect(state.draft).toBe("work trip");
    expect(resolvedTags(state.value)).toEqual(["home", "work trip"]);
    expect(editTagsInput(state, state.draft, true).tags).toEqual(["home", "work trip"]);
  });

  it("keeps a pasted excess tag visible so validation can explain how to fix it", () => {
    const state = editTagsInput(readTagsInput("one"), "two, three, four, five");
    expect(state.tags).toEqual(["one", "two", "three", "four"]);
    expect(state.draft).toBe(" five");
    expect(tagsSchema().safeParse(state.value).success).toBe(false);
    const repaired = removeTagInput(state, 0);
    expect(repaired.draft).toBe(" five");
    expect(tagsSchema().safeParse(repaired.value).success).toBe(true);
  });

  it("does not add a duplicate committed tag or split multiword tags", () => {
    const state = editTagsInput(readTagsInput("Food"), "food, work trip,", true);
    expect(state.tags).toEqual(["Food", "work trip"]);
    expect(state.draft).toBe("");
  });
});
