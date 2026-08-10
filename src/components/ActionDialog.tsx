"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import {
  AlertTriangle,
  CircleAlert,
  Info,
  LoaderCircle,
  X,
} from "lucide-react";

type ActionDialogVariant = "info" | "warning" | "danger";

type Props = {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
  variant?: ActionDialogVariant;
  eyebrow?: string;
  cancelLabel?: string | null;
  isPending?: boolean;
  pendingLabel?: string;
  children?: ReactNode;
};

const ICONS = {
  danger: CircleAlert,
  info: Info,
  warning: AlertTriangle,
} as const;

export function ActionDialog({
  open,
  title,
  description,
  confirmLabel,
  onConfirm,
  onClose,
  variant = "warning",
  eyebrow = "Konfirmasi",
  cancelLabel = "Batal",
  isPending = false,
  pendingLabel = "Memproses...",
  children,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const Icon = ICONS[variant];

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  const closeDialog = () => {
    if (!isPending) onClose();
  };

  return (
    <dialog
      aria-describedby={descriptionId}
      aria-labelledby={titleId}
      className={`action-dialog action-dialog-${variant}`}
      onCancel={(event) => {
        event.preventDefault();
        closeDialog();
      }}
      ref={dialogRef}
    >
      <div className="action-dialog-content">
        <header className="action-dialog-header">
          <span className="action-dialog-icon" aria-hidden="true">
            <Icon size={21} />
          </span>
          <div>
            <p>{eyebrow}</p>
            <h2 id={titleId}>{title}</h2>
          </div>
          <button
            aria-label="Tutup dialog"
            className="action-dialog-close"
            disabled={isPending}
            onClick={closeDialog}
            type="button"
          >
            <X aria-hidden="true" size={19} />
          </button>
        </header>

        <div className="action-dialog-body">
          <p className="action-dialog-description" id={descriptionId}>
            {description}
          </p>
          {children ? <div className="action-dialog-detail">{children}</div> : null}
        </div>

        <footer className="action-dialog-actions">
          {cancelLabel ? (
            <button
              autoFocus
              className="brand-secondary-button"
              disabled={isPending}
              onClick={closeDialog}
              type="button"
            >
              {cancelLabel}
            </button>
          ) : null}
          <button
            className={
              variant === "danger"
                ? "brand-danger-button"
                : "brand-primary-button"
            }
            disabled={isPending}
            onClick={onConfirm}
            type="button"
          >
            {isPending ? (
              <LoaderCircle
                aria-hidden="true"
                className="dialog-loader"
                size={16}
              />
            ) : null}
            {isPending ? pendingLabel : confirmLabel}
          </button>
        </footer>
      </div>
    </dialog>
  );
}
