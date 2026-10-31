"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { safeErrorMessage } from "@/lib/utils";

export function UploadDialog() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [file, setFile] = React.useState<File | null>(null);
  const [title, setTitle] = React.useState("");
  const [folder, setFolder] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      if (title.trim()) form.append("title", title.trim());
      if (folder.trim()) form.append("folder", folder.trim());
      const res = await fetch("/api/library/upload", { method: "POST", body: form });
      const data = (await res.json().catch(() => ({}))) as { error?: string; document?: { status?: string } };
      if (!res.ok) {
        toast.error(safeErrorMessage(data.error, "Upload failed"));
        if (res.status === 409) {
          setOpen(false);
          router.refresh();
        }
        return;
      }
      toast.success(data.document?.status === "ready" ? "Document processed and searchable" : "Upload queued");
      setOpen(false);
      setFile(null);
      setTitle("");
      router.refresh();
    } catch (e) {
      toast.error(safeErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Upload className="mr-1 h-4 w-4" /> Upload material
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload study material</DialogTitle>
          <DialogDescription>
            PDF, DOCX, PPTX, TXT and images (scanned docs need an OCR endpoint). Files are stored privately and processed
            into searchable chunks.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file">File</Label>
            <Input
              id="file"
              type="file"
              accept=".pdf,.docx,.pptx,.txt,.md,.csv,.html,.png,.jpg,.jpeg,.webp,.gif"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">Title (optional)</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={file?.name.replace(/\.[^.]+$/, "") ?? "Document title"} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="folder">Folder (optional)</Label>
            <Input id="folder" value={folder} onChange={(e) => setFolder(e.target.value)} placeholder="e.g. Cardiology" />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !file}>
              {loading ? (
                <>
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" /> Processing…
                </>
              ) : (
                "Upload"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
