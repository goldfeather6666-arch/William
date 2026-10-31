import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { processDocument } from "@/lib/documents/pipeline";
import { slugify } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function ensureBucket(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { error } = await supabase.storage.createBucket("documents", { public: false });
  if (error && error.message && !error.message.toLowerCase().includes("already exists")) {
    // Re-check: if it exists, ignore; otherwise surface.
    const { data } = await supabase.storage.getBucket("documents");
    if (!data) throw error;
  }
}

const ALLOWED_MIME = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // docx
  "application/vnd.openxmlformats-officedocument.presentationml.presentation", // pptx
  "text/plain",
  "text/markdown",
  "text/csv",
  "text/html",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "application/octet-stream",
]);

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const title = (form.get("title") as string | null)?.trim() || file.name.replace(/\.[^.]+$/, "");
  const folder = (form.get("folder") as string | null)?.trim() || null;

  if (file.size > 20 * 1024 * 1024) {
    return NextResponse.json({ error: "File must be 20 MB or smaller" }, { status: 413 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "File is empty" }, { status: 400 });
  }
  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 415 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const checksum = crypto.createHash("sha256").update(buffer).digest("hex");

  // Duplicate detection within this user's library.
  const { data: dup } = await supabase
    .from("documents")
    .select("id,title")
    .eq("user_id", user.id)
    .eq("checksum", checksum)
    .maybeSingle();
  if (dup) {
    return NextResponse.json({ error: "This file is already in your library", duplicate: dup }, { status: 409 });
  }

  const safeName = `${slugify(file.name) || "document"}-${Date.now()}.${file.name.split(".").pop() ?? ""}`;
  const storagePath = `${user.id}/${safeName}`;

  try {
    await ensureBucket(supabase);
    const { error: uploadError } = await supabase.storage.from("documents").upload(storagePath, file, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false,
    });
    if (uploadError) {
      return NextResponse.json({ error: `Storage upload failed: ${uploadError.message}` }, { status: 500 });
    }
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Storage unavailable" },
      { status: 500 },
    );
  }

  const { data: doc, error: docError } = await supabase
    .from("documents")
    .insert({
      user_id: user.id,
      title,
      file_name: file.name,
      mime_type: file.type,
      size_bytes: file.size,
      storage_path: storagePath,
      folder,
      status: "uploaded",
      checksum,
    })
    .select("id")
    .single();
  if (docError || !doc) {
    return NextResponse.json({ error: "Could not record the document" }, { status: 500 });
  }

  await supabase.from("document_jobs").insert({ document_id: doc.id, user_id: user.id, status: "queued", stage: "uploaded" });

  // Run the pipeline now. We never report success until it finishes.
  const result = await processDocument(doc.id);

  const { data: finalDoc } = await supabase.from("documents").select("*").eq("id", doc.id).single();

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error ?? "Processing failed", document: finalDoc },
      { status: 422 },
    );
  }

  return NextResponse.json({ document: finalDoc });
}
