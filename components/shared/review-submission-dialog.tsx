"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FileText, Image as ImageIcon, Video, Eye } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useSnackbar } from "@/lib/useSnackbar";

interface SubmissionFile {
  id: string;
  fileType: "IMAGE" | "VIDEO" | "DOCUMENT";
  fileName: string;
  filePath: string;
}

interface Submission {
  id: string;
  description: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  submittedBy: { user: { name: string | null; email: string } };
  files: SubmissionFile[];
}

interface Props {
  planId: string;
  deptId: string;
  taskId: string;
  submission: Submission;
  onReviewed?: () => void;
  trigger?: React.ReactNode;
}

export function ReviewSubmissionDialog({ planId, deptId, taskId, submission, onReviewed, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { show } = useSnackbar();

  async function review(action: "APPROVE" | "REJECT") {
    if (action === "REJECT" && !comment.trim()) {
      return setError("A reason is required to request changes");
    }
    setError(null);
    setSubmitting(true);
    try {
      await authClient.request(
        `/api/plan/${planId}/departments/${deptId}/tasks/${taskId}/submissions/${submission.id}`,
        { method: "PATCH", data: { action, reviewComment: comment.trim() || undefined } }
      );
      show(action === "APPROVE" ? "Task approved" : "Changes requested", "success");
      setOpen(false);
      onReviewed?.();
    } catch (err: any) {
      setError(err?.response?.data?.error || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" variant="outline" className="gap-1.5 cursor-pointer hover:text-gray-600">
            <Eye className="h-3.5 w-3.5" />
            Review
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review Submission</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Submitted by</p>
              <p className="font-medium">{submission.submittedBy.user.name || submission.submittedBy.user.email}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Submitted on</p>
              <p className="font-medium">{new Date(submission.createdAt).toLocaleString()}</p>
            </div>
          </div>

          {submission.description && (
            <div>
              <Label className="text-xs text-muted-foreground">Description</Label>
              <div className="mt-1 rounded-md border border-border p-3 text-sm whitespace-pre-wrap">
                {submission.description}
              </div>
            </div>
          )}

          {submission.files.length > 0 && (
            <div>
              <Label className="text-xs text-muted-foreground">Evidence ({submission.files.length})</Label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {submission.files.map((f) => (
                  <a
                    key={f.id}
                    href={f.filePath}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 rounded-md border border-border p-2 text-xs hover:bg-muted/50"
                  >
                    {f.fileType === "IMAGE" ? (
                      <ImageIcon className="h-3.5 w-3.5 shrink-0" />
                    ) : f.fileType === "VIDEO" ? (
                      <Video className="h-3.5 w-3.5 shrink-0" />
                    ) : (
                      <FileText className="h-3.5 w-3.5 shrink-0" />
                    )}
                    <span className="truncate">{f.fileName}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {submission.status === "PENDING" ? (
            <div className="space-y-2 border-t border-border pt-4">
              <Label className="text-xs text-muted-foreground">Comment (required to request changes)</Label>
              <Textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2} className="resize-none" />
              {error && <p className="text-xs text-destructive">{error}</p>}
            </div>
          ) : (
            <Badge variant={submission.status === "APPROVED" ? "default" : "destructive"}>{submission.status}</Badge>
          )}
        </div>

        {submission.status === "PENDING" && (
          <DialogFooter>
            <Button variant="destructive" onClick={() => review("REJECT")} disabled={submitting} className="cursor-pointer">
              Request Changes
            </Button>
            <Button onClick={() => review("APPROVE")} disabled={submitting} className="cursor-pointer">
              Approve
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}