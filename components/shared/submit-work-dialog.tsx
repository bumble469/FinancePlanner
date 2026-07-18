"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Upload, X, FileText, Image as ImageIcon, Video, CheckCircle2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useSnackbar } from "@/lib/useSnackbar";

interface Requirement {
  requireDescription: boolean;
  requireImages: boolean;
  minImages: number | null;
  maxImages: number | null;
  requireVideo: boolean;
  requireDocument: boolean;
  allowMultipleEvidenceTypes: boolean;
}

interface Props {
  planId: string;
  deptId: string;
  taskId: string;
  taskTitle: string;
  requirement?: Requirement | null;
  isResubmit?: boolean;
  onSubmitted?: () => void;
  trigger?: React.ReactNode;
}

export function SubmitWorkDialog({
  planId,
  deptId,
  taskId,
  taskTitle,
  requirement,
  isResubmit,
  onSubmitted,
  trigger,
}: Props) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { show } = useSnackbar();

  function addFiles(list: FileList | null) {
    if (!list) return;
    setFiles((prev) => [...prev, ...Array.from(list)]);
  }
  function removeFile(idx: number) {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  function iconFor(file: File) {
    if (file.type.startsWith("image/")) return <ImageIcon className="h-3.5 w-3.5" />;
    if (file.type.startsWith("video/")) return <Video className="h-3.5 w-3.5" />;
    return <FileText className="h-3.5 w-3.5" />;
  }

  async function handleSubmit() {
    setError(null);

    if (requirement?.requireDescription && !description.trim()) {
      return setError("A description is required for this task");
    }
    if (requirement?.requireImages) {
      const imgCount = files.filter((f) => f.type.startsWith("image/")).length;
      if (imgCount < (requirement.minImages ?? 1)) {
        return setError(`At least ${requirement.minImages ?? 1} image(s) required`);
      }
    }
    if (requirement?.requireVideo && !files.some((f) => f.type.startsWith("video/"))) {
      return setError("A video is required for this task");
    }
    if (requirement?.requireDocument) {
      const hasDoc = files.some((f) => !f.type.startsWith("image/") && !f.type.startsWith("video/"));
      if (!hasDoc) return setError("A document/file is required for this task");
    }

    setSubmitting(true);
    try {
      const form = new FormData();
      form.append("description", description.trim());
      files.forEach((f) => form.append("files", f));

      await authClient.request(
        `/api/plan/${planId}/departments/${deptId}/tasks/${taskId}/submissions`,
        { method: "POST", data: form, headers: { "Content-Type": "multipart/form-data" } }
      );

      show("Work submitted for review", "success");
      setOpen(false);
      setDescription("");
      setFiles([]);
      onSubmitted?.();
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" className="gap-1.5 cursor-pointer">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {isResubmit ? "Resubmit Work" : "Submit Work"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isResubmit ? "Resubmit Work" : "Submit Work"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <p className="text-sm text-muted-foreground">
            Submitting evidence for <span className="font-medium text-foreground">"{taskTitle}"</span>
          </p>

          <div className="space-y-1.5">
            <Label>
              Description {requirement?.requireDescription && <span className="text-destructive">*</span>}
            </Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What did you complete?"
              rows={3}
              className="resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <Label>
              Evidence{" "}
              {(requirement?.requireImages || requirement?.requireVideo || requirement?.requireDocument) && (
                <span className="text-destructive">*</span>
              )}
            </Label>
            <label className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border p-6 text-center hover:bg-muted/50">
              <Upload className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Click to upload images, video, or files</span>
              <input
                type="file"
                multiple
                className="hidden"
                onChange={(e) => addFiles(e.target.files)}
              />
            </label>

            {files.length > 0 && (
              <div className="space-y-1.5">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center justify-between rounded-md border border-border px-3 py-1.5 text-sm">
                    <span className="flex items-center gap-2 truncate">
                      {iconFor(f)}
                      <span className="truncate">{f.name}</span>
                    </span>
                    <button onClick={() => removeFile(i)} className="cursor-pointer text-muted-foreground hover:text-destructive">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting} className="cursor-pointer">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting} className="cursor-pointer">
            {submitting ? "Submitting..." : "Submit for Review"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}