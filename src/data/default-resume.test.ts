import { describe, expect, it } from "vitest";
import { DEFAULT_RESUMES, getDefaultResumeLanguage, isDefaultResume } from "./default-resume";

describe("default resume helpers", () => {
  it("detects the language of the built-in chinese example", () => {
    expect(getDefaultResumeLanguage(DEFAULT_RESUMES.zh)).toBe("zh");
  });

  it("detects the language of the built-in english example", () => {
    expect(getDefaultResumeLanguage(DEFAULT_RESUMES.en)).toBe("en");
  });

  it("treats custom content as non-default", () => {
    expect(getDefaultResumeLanguage("# Custom Resume")).toBeNull();
    expect(isDefaultResume("# Custom Resume")).toBe(false);
  });
});
