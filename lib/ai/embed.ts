import crypto from "node:crypto";

/**
 * Deterministic local embedding fallback (labelled "local-hash"). This is not a
 * semantic model; it exists so the pipeline can run without an embedding
 * provider. It returns a fixed-length vector derived from token hashes, which
 * supports exact/intent-neutral matching and is stable across runs.
 */
export function embedLocal(text: string, dims = 256): number[] {
  const vec = new Array<number>(dims).fill(0);
  const tokens = text.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  for (const token of tokens) {
    const h = Number(BigInt.asUintN(53, BigInt("0x" + crypto.createHash("sha256").update(token).digest("hex").slice(0, 14))));
    const idx = h % dims;
    vec[idx] = (vec[idx] ?? 0) + 1;
  }
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    dot += x * y;
    na += x * x;
    nb += y * y;
  }
  return na === 0 || nb === 0 ? 0 : dot / (Math.sqrt(na) * Math.sqrt(nb));
}
