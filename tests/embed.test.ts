import { describe, expect, it } from "vitest";
import { cosineSimilarity, embedLocal } from "@/lib/ai/embed";

describe("local embeddings", () => {
  it("returns a fixed-length normalised vector", () => {
    const v = embedLocal("the heart pumps blood");
    expect(v).toHaveLength(256);
    const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
    expect(norm).toBeCloseTo(1, 5);
  });

  it("is deterministic for identical input", () => {
    expect(embedLocal("troponin is a biomarker")).toEqual(embedLocal("troponin is a biomarker"));
  });

  it("cosine similarity is 1 for identical vectors", () => {
    const a = embedLocal("b-type natriuretic peptide");
    expect(cosineSimilarity(a, a)).toBeGreaterThan(0.999);
  });

  it("cosine similarity handles empty vectors", () => {
    expect(cosineSimilarity([0, 0], [0, 0])).toBe(0);
    expect(cosineSimilarity([1, 0], [0, 0])).toBe(0);
  });

  it("related text scores higher than unrelated", () => {
    const a = embedLocal("chest pain on exertion angina");
    const b = embedLocal("angina is exertional chest pain");
    const c = embedLocal("quantum physics example");
    expect(cosineSimilarity(a, b)).toBeGreaterThan(cosineSimilarity(a, c));
  });
});
