"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { FileText, FolderOpen, Search, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { UploadDialog } from "@/components/library/upload-dialog";
import { formatBytes, formatDate, safeErrorMessage } from "@/lib/utils";
import type { DocumentRow } from "@/lib/types";

const statusVariant: Record<string, "secondary" | "clinical" | "destructive" | "soft"> = {
  ready: "clinical",
  uploaded: "secondary",
  extracting: "secondary",
  chunking: "secondary",
  embedding: "secondary",
  failed: "destructive",
};

export default function LibraryPage() {
  const router = useRouter();
  const [docs, setDocs] = React.useState<DocumentRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [query, setQuery] = React.useState("");

  React.useEffect(() => {
    let active = true;
    async function load() {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("documents")
          .select("*")
          .order("created_at", { ascending: false });
        if (active) setDocs((data as DocumentRow[]) ?? []);
      } catch {
        // unconfigured
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  async function removeDoc(id: string) {
    try {
      const supabase = createClient();
      const doc = docs.find((d) => d.id === id);
      if (doc) {
        await supabase.storage.from("documents").remove([doc.storage_path]);
      }
      const { error } = await supabase.from("documents").delete().eq("id", id);
      if (error) throw error;
      setDocs((prev) => prev.filter((d) => d.id !== id));
      toast.success("Document deleted");
    } catch (e) {
      toast.error(safeErrorMessage(e));
    }
  }

  const folders = Array.from(new Set(docs.map((d) => d.folder).filter(Boolean))) as string[];
  const filtered = query.trim()
    ? docs.filter((d) => `${d.title} ${d.file_name} ${d.folder ?? ""}`.toLowerCase().includes(query.toLowerCase()))
    : docs;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Knowledge Library</h1>
          <p className="text-sm text-muted-foreground">Your uploads become a searchable personal base.</p>
        </div>
        <UploadDialog />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search your library…" className="pl-9" />
        </div>
      </div>

      {folders.length > 0 && query === "" && (
        <div className="flex flex-wrap gap-2">
          {folders.map((f) => (
            <Badge key={f} variant="soft">
              <FolderOpen className="mr-1 h-3 w-3" /> {f}
            </Badge>
          ))}
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <FileText className="h-5 w-5" />
            </span>
            <p className="font-medium">No documents yet</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Upload PDFs, lecture slides or notes. They&apos;ll be processed into searchable chunks you can ask questions
              against.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((d) => (
            <Card key={d.id} className="flex flex-col">
              <CardContent className="flex flex-1 flex-col p-5">
                <div className="flex items-start justify-between gap-2">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft text-primary">
                    <FileText className="h-4 w-4" />
                  </span>
                  <Badge variant={statusVariant[d.status] ?? "secondary"}>{d.status}</Badge>
                </div>
                <h3 className="mt-3 font-medium">{d.title}</h3>
                <p className="mt-1 truncate text-xs text-muted-foreground">{d.file_name}</p>
                <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{formatBytes(d.size_bytes)}</span>
                  {d.page_count != null && <span>· {d.page_count} p</span>}
                  <span>· {formatDate(d.created_at)}</span>
                </div>
                {d.status === "failed" && d.error_message && (
                  <p className="mt-2 rounded bg-destructive/5 px-2 py-1.5 text-xs text-destructive">{d.error_message}</p>
                )}
                {d.extracted_preview && d.status === "ready" && (
                  <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-muted-foreground">{d.extracted_preview}</p>
                )}
                <div className="mt-auto flex justify-end pt-3">
                  <Button variant="ghost" size="icon-sm" onClick={() => removeDoc(d.id)} aria-label="Delete document">
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Tip: open the AI Tutor and pick a document from the context menu to ask questions grounded in that material.
      </p>
    </div>
  );
}
