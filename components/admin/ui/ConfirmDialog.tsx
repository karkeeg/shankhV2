"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";
import { Modal } from "./Modal";
import { AdminButton } from "./AdminButton";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Use the danger styling for destructive actions (default true). */
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

/** Shared confirmation dialog for delete/destructive actions. */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  destructive = true,
  loading = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      dismissable={!loading}
      title={title}
      footer={
        <>
          <AdminButton variant="ghost" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </AdminButton>
          <AdminButton
            variant={destructive ? "danger" : "primary"}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </AdminButton>
        </>
      }
    >
      <div className="flex items-start gap-3">
        {destructive && (
          <div className="p-2.5 bg-rose-50 text-rose-500 rounded-xl shrink-0">
            <AlertTriangle size={18} />
          </div>
        )}
        <div className="text-xs text-zinc-600 font-medium leading-relaxed pt-0.5">{message}</div>
      </div>
    </Modal>
  );
}
