import { describe, expect, it } from "vitest";
import {
  clamp,
  formatBytes,
  initials,
  percentage,
  pluralize,
  safeErrorMessage,
  slugify,
  truncate,
  unique,
} from "@/lib/utils";

describe("lib/utils", () => {
  it("clamp clamps to bounds", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-3, 0, 10)).toBe(0);
    expect(clamp(50, 0, 10)).toBe(10);
  });

  it("formatBytes humanises sizes", () => {
    expect(formatBytes(0)).toBe("—");
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(2048)).toBe("2 KB");
    expect(formatBytes(5 * 1024 * 1024)).toBe("5 MB");
  });

  it("initials handles names and emails", () => {
    expect(initials("Ayesha Rahman")).toBe("AR");
    expect(initials("Dr. Ayesha Rahman")).toBe("DA");
    expect(initials(undefined, "ahmed@med.edu")).toBe("AH");
    expect(initials(undefined)).toBe("MC");
  });

  it("slugify normalises", () => {
    expect(slugify("Acute Coronary Syndrome!")).toBe("acute-coronary-syndrome");
    expect(slugify("  Hypertension ")).toBe("hypertension");
  });

  it("percentage computes and clamps", () => {
    expect(percentage(3, 4)).toBe(75);
    expect(percentage(0, 0)).toBe(0);
    expect(percentage(5, 2)).toBe(100);
  });

  it("pluralize handles singular/plural", () => {
    expect(pluralize(1, "card")).toBe("card");
    expect(pluralize(3, "card")).toBe("cards");
    expect(pluralize(2, "quiz", "quizzes")).toBe("quizzes");
  });

  it("truncate adds ellipsis", () => {
    expect(truncate("short")).toBe("short");
    expect(truncate("a".repeat(200))).toHaveLength(160);
  });

  it("unique removes duplicates", () => {
    expect(unique([1, 2, 2, 3])).toEqual([1, 2, 3]);
  });

  it("safeErrorMessage returns fallback for empty errors", () => {
    expect(safeErrorMessage(new Error("boom"))).toBe("boom");
    expect(safeErrorMessage(null, "fallback")).toBe("fallback");
  });
});
