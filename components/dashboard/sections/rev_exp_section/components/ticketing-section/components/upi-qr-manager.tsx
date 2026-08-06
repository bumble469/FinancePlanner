"use client";
import { useRef, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useSnackbar } from "@/lib/useSnackbar";
import { Button } from "@/components/ui/button";
import { QrCode, Upload, Trash2 } from "lucide-react";

interface Props {
  planId: string;
  upiQrUrl: string | null;
  canManage: boolean;
  onChanged: (url: string | null) => void;
}

export function UpiQrManager({ planId, upiQrUrl, canManage, onChanged }: Props) {
  const { show } = useSnackbar();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await authClient.request(`/api/plan/${planId}/ticketing/qr`, {
        method: "POST",
        data: formData,
        headers: { "Content-Type": "multipart/form-data" },
      });
      onChanged(res.data.data.upiQrUrl);
      show("Payment QR updated", "success");
    } catch (err: any) {
      show(err?.response?.data?.error || "Failed to upload QR", "error");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async () => {
    try {
      await authClient.request(`/api/plan/${planId}/ticketing/qr`, { method: "DELETE" });
      onChanged(null);
      show("Payment QR removed", "success");
    } catch (err: any) {
      show(err?.response?.data?.error || "Failed to remove QR", "error");
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <QrCode className="h-4 w-4 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">UPI payment QR</p>
      </div>

      {upiQrUrl ? (
        <div className="flex items-center gap-4">
          <img src={upiQrUrl} alt="UPI QR code" className="w-24 h-24 object-contain rounded-md border border-border" />
          {canManage && (
            <div className="flex flex-col gap-2">
              <Button
                size="sm" variant="outline" className="gap-1.5 cursor-pointer hover:text-gray-600"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Upload className="h-3.5 w-3.5" />
                Replace
              </Button>
              <Button
                size="sm" variant="ghost" className="gap-1.5 text-destructive hover:text-destructive cursor-pointer"
                onClick={handleDelete}
                disabled={uploading}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove
              </Button>
            </div>
          )}
        </div>
      ) : canManage ? (
        <Button
          size="sm" variant="outline" className="gap-1.5 cursor-pointer hover:text-gray-600"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          <Upload className="h-3.5 w-3.5" />
          {uploading ? "Uploading..." : "Upload QR"}
        </Button>
      ) : (
        <p className="text-xs text-muted-foreground">No QR uploaded yet</p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  );
}