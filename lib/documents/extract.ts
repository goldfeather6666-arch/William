import { extractText } from "unpdf";
import mammoth from "mammoth";
import JSZip from "jszip";
import { ocrEndpoint } from "@/lib/env";

export interface ExtractedText {
  text: string;
  pages: number | null;
  /** page → text segments when page boundaries are known */
  pageSegments?: { page: number; text: string }[];
}

function fallbackDecode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  // Try UTF-8, then latin1.
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return new TextDecoder("latin1").decode(bytes);
  }
}

export async function extractPdf(buffer: ArrayBuffer): Promise<ExtractedText> {
  const { text, totalPages } = await extractText(buffer);
  const segments: { page: number; text: string }[] = [];
  const split = text.split(/\f/);
  if (split.length > 1) {
    split.forEach((chunk, i) => {
      if (chunk.trim()) segments.push({ page: i + 1, text: chunk.trim() });
    });
  }
  return {
    text: text.trim(),
    pages: totalPages ?? (segments.length || null),
    pageSegments: segments.length ? segments : undefined,
  };
}

export async function extractDocx(buffer: ArrayBuffer): Promise<ExtractedText> {
  const result = await mammoth.extractRawText({ buffer });
  return { text: result.value.trim(), pages: null };
}

export async function extractPptx(buffer: ArrayBuffer): Promise<ExtractedText> {
  const zip = await JSZip.loadAsync(buffer);
  const slideFiles = Object.keys(zip.files)
    .filter((f) => /^ppt\/slides\/slide\d+\.xml$/i.test(f))
    .sort((a, b) => parseInt(a.match(/\d+/)![0] ?? "0", 10) - parseInt(b.match(/\d+/)![0] ?? "0", 10));
  const parts: string[] = [];
  for (const name of slideFiles) {
    const xml = await zip.files[name]!.async("text");
    const text = xml
      .replace(/<a:t[^>]*>([\s\S]*?)<\/a:t>/g, "$1")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim();
    if (text) parts.push(text);
  }
  return { text: parts.join("\n\n"), pages: parts.length || null };
}

export async function extractPlain(buffer: ArrayBuffer): Promise<ExtractedText> {
  return { text: fallbackDecode(buffer).trim(), pages: null };
}

export async function extractImage(buffer: ArrayBuffer, mime: string): Promise<ExtractedText> {
  const endpoint = ocrEndpoint();
  if (!endpoint) {
    throw new Error("Image/scanned document OCR requires an OCR endpoint (OCR_ENDPOINT_URL) to be configured.");
  }
  const base64 = Buffer.from(buffer).toString("base64");
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: base64, mime }),
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) {
    throw new Error(`OCR service returned HTTP ${res.status}`);
  }
  const data = (await res.json()) as { text?: string };
  return { text: (data.text ?? "").trim(), pages: null };
}

export async function extractFile(
  buffer: ArrayBuffer,
  fileName: string,
  mimeType: string,
): Promise<ExtractedText> {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return extractPdf(buffer);
  if (ext === "docx") return extractDocx(buffer);
  if (ext === "pptx") return extractPptx(buffer);
  if (ext === "txt" || ext === "md" || ext === "csv" || ext === "html") return extractPlain(buffer);
  if (mimeType.startsWith("image/")) return extractImage(buffer, mimeType);
  if (ext === "doc" || ext === "ppt" || ext === "xls") {
    throw new Error("Legacy Office formats (.doc/.ppt/.xls) are not supported. Please upload .docx/.pptx/.xlsx.");
  }
  throw new Error(`Unsupported file type: ${fileName}`);
}
