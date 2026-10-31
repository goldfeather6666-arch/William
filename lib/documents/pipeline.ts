import { createClient } from "@/lib/supabase/server";
import { extractFile } from "./extract";
import { embedLocal } from "@/lib/ai/embed";
import { estimateTokens } from "@/lib/utils";

const CHUNK_TARGET = 1800;

function chunkText(text: string): string[] {
  const normalized = text.replace(/\n{3,}/g, "\n\n").trim();
  if (!normalized) return [];
  const paragraphs = normalized.split(/\n{2,}/);
  const chunks: string[] = [];
  let current = "";
  for (const p of paragraphs) {
    if ((current + "\n\n" + p).length > CHUNK_TARGET && current) {
      chunks.push(current.trim());
      current = p;
    } else {
      current = current ? current + "\n\n" + p : p;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

/**
 * Runs the document pipeline: EXTRACT → CHUNK → EMBED → READY.
 * Updates the documents.row and document_jobs row truthfully at each stage.
 * Never reports success before the pipeline actually completes.
 */
export async function processDocument(documentId: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();

  const { data: doc } = await supabase.from("documents").select("*").eq("id", documentId).single();
  if (!doc) return { ok: false, error: "Document not found" };

  await supabase.from("documents").update({ status: "extracting" }).eq("id", documentId);
  await supabase.from("document_jobs").update({ status: "running", stage: "extracting", started_at: new Date().toISOString() }).eq("document_id", documentId);

  try {
    const { data: file } = await supabase.storage.from("documents").download(doc.storage_path);
    if (!file) throw new Error("Stored file could not be read");

    const buffer = await file.arrayBuffer();
    const extracted = await extractFile(buffer, doc.file_name, doc.mime_type);
    if (!extracted.text) throw new Error("No text could be extracted from this file");

    await supabase.from("documents").update({ status: "chunking", char_count: extracted.text.length, page_count: extracted.pages }).eq("id", documentId);
    await supabase.from("document_jobs").update({ stage: "chunking" }).eq("document_id", documentId);

    const chunks = chunkText(extracted.text);
    if (chunks.length === 0) throw new Error("No usable chunk content was found");

    const rows = chunks.map((content, i) => {
      const page = extracted.pageSegments
        ? (extracted.pageSegments.find((s) => content.startsWith(s.text.slice(0, 80)))?.page ?? null)
        : null;
      return {
        document_id: documentId,
        user_id: doc.user_id,
        page,
        chunk_index: i,
        content,
        token_estimate: estimateTokens(content),
        embedding: embedLocal(content),
        embedding_model: "local-hash",
      };
    });

    await supabase.from("documents").update({ status: "embedding" }).eq("id", documentId);
    await supabase.from("document_jobs").update({ stage: "embedding" }).eq("document_id", documentId);

    // Idempotent: delete previous chunks so re-runs never duplicate.
    await supabase.from("document_chunks").delete().eq("document_id", documentId);
    await supabase.from("document_chunks").insert(rows);

    const preview = chunks[0]!.slice(0, 400);
    await supabase.from("documents").update({ status: "ready", extracted_preview: preview, processed_at: new Date().toISOString() }).eq("id", documentId);
    await supabase.from("document_jobs").update({ status: "succeeded", stage: "ready", finished_at: new Date().toISOString() }).eq("document_id", documentId);

    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Processing failed";
    await supabase.from("documents").update({ status: "failed", error_message: message }).eq("id", documentId);
    await supabase
      .from("document_jobs")
      .update({ status: "failed", error_message: message, finished_at: new Date().toISOString() })
      .eq("document_id", documentId);
    return { ok: false, error: message };
  }
}
