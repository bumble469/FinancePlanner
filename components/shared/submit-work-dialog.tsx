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
import { Upload, X, FileText, Image as ImageIcon, Video, CheckCircle2, Info } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useSnackbar } from "@/lib/useSnackbar";
import { TaskRequirement } from "@/lib/types";

interface Props {
  planId: string;
  deptId: string;
  taskId: string;
  taskTitle: string;
  requirement?: TaskRequirement | null;
  isResubmit?: boolean;
  onSubmitted?: () => void;
  trigger?: React.ReactNode;
}

function kindOf(file: File): "IMAGE" | "VIDEO" | "DOCUMENT" {
  if (file.type.startsWith("image/")) return "IMAGE";
  if (file.type.startsWith("video/")) return "VIDEO";
  return "DOCUMENT";
}

function requirementLines(req?: TaskRequirement | null): string[] {
  if (!req) return ["No specific evidence required — a description alone is fine."];

  const lines: string[] = [];
  if (req.requireDescription) lines.push("A description of the work");
  if (req.requireImages) {
    const min = req.minImages ?? 1;
    const max = req.maxImages;
    lines.push(max ? `${min}–${max} image(s)` : `At least ${min} image(s)`);
  }
  if (req.requireVideo) lines.push("At least 1 video");
  if (req.requireDocument) lines.push("At least 1 document/file");

  if (lines.length === 0) {
    lines.push("No specific evidence required — a description alone is fine, or attach up to 1 file.");
  }
  return lines;
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

  const hasAnyEvidenceRequirement = !!(
    requirement?.requireImages ||
    requirement?.requireVideo ||
    requirement?.requireDocument
  );

  function addFiles(list: FileList | null) {
    if (!list) return;
    setError(null);

    const incoming = Array.from(list);
    const rejected: string[] = [];
    const accepted: File[] = [];

    for (const f of incoming) {
      const kind = kindOf(f);
      const allowed =
        !hasAnyEvidenceRequirement // no requirement → any type ok, count cap handled at submit
          ? true
          : (kind === "IMAGE" && requirement?.requireImages) ||
            (kind === "VIDEO" && requirement?.requireVideo) ||
            (kind === "DOCUMENT" && requirement?.requireDocument);

      if (allowed) accepted.push(f);
      else rejected.push(f.name);
    }

    if (rejected.length > 0) {
      setError(
        `"${rejected.join('", "')}" ${rejected.length > 1 ? "aren't" : "isn't"} an accepted evidence type for this task.`
      );
    }

    setFiles((prev) => [...prev, ...accepted]);
  }
  function removeFile(idx: number) {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  function iconFor(file: File) {
    const kind = kindOf(file);
    if (kind === "IMAGE") return <ImageIcon className="h-3.5 w-3.5" />;
    if (kind === "VIDEO") return <Video className="h-3.5 w-3.5" />;
    return <FileText className="h-3.5 w-3.5" />;
  }

  function validate(): string | null {
    if (requirement?.requireDescription && !description.trim()) {
      return "A description is required for this task";
    }

    const imageCount = files.filter((f) => kindOf(f) === "IMAGE").length;
    const videoCount = files.filter((f) => kindOf(f) === "VIDEO").length;
    const docCount = files.filter((f) => kindOf(f) === "DOCUMENT").length;

    if (!hasAnyEvidenceRequirement) {
      // No specific evidence type required — allow at most 1 file total, of any type.
      if (files.length > 1) {
        return "This task has no specific evidence requirement, so you can attach at most 1 file.";
      }
      return null;
    }

    // Reject any evidence type that isn't actually required.
    if (imageCount > 0 && !requirement?.requireImages) {
      return "Images aren't required for this task — remove them or check the requirements.";
    }
    if (videoCount > 0 && !requirement?.requireVideo) {
      return "A video isn't required for this task — remove it or check the requirements.";
    }
    if (docCount > 0 && !requirement?.requireDocument) {
      return "A document isn't required for this task — remove it or check the requirements.";
    }

    if (requirement?.requireImages) {
      const min = requirement.minImages ?? 1;
      if (imageCount < min) return `At least ${min} image(s) required`;
      if (requirement.maxImages && imageCount > requirement.maxImages) {
        return `No more than ${requirement.maxImages} image(s) allowed`;
      }
    }
    if (requirement?.requireVideo && videoCount < 1) {
      return "A video is required for this task";
    }
    if (requirement?.requireDocument && docCount < 1) {
      return "A document/file is required for this task";
    }

    if (!requirement?.allowMultipleEvidenceTypes) {
      const typesUsed = [imageCount > 0, videoCount > 0, docCount > 0].filter(Boolean).length;
      if (typesUsed > 1) return "Only one type of evidence is allowed for this task";
    }

    return null;
  }

  async function handleSubmit() {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);

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
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
    onSubmitted?.();
  }

  function acceptFor(): string | undefined {
    if (!hasAnyEvidenceRequirement) return undefined; // any single file allowed
    const parts: string[] = [];
    if (requirement?.requireImages) parts.push("image/*");
    if (requirement?.requireVideo) parts.push("video/*");
    if (requirement?.requireDocument) parts.push(".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,application/pdf");
    return parts.join(",");
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

          <div className="flex gap-2 rounded-lg border border-border bg-muted/30 p-3">
            <Info className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">What you need to submit:</p>
              <ul className="list-disc pl-4 space-y-0.5">
                {requirementLines(requirement).map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            </div>
          </div>

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
              <span className="text-sm text-muted-foreground">
                {hasAnyEvidenceRequirement
                  ? "Click to upload images, video, or files"
                  : "Click to attach a file (max 1)"}
              </span>
              <input
                type="file"
                multiple={hasAnyEvidenceRequirement}
                accept={acceptFor()}
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