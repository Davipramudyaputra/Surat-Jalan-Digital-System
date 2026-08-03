"use client";

import { useActionState } from "react";

import { changePasswordAction } from "../actions";
import { KeyRound } from "lucide-react";

const initialState = { error: "", success: "" };

export function ChangePasswordForm() {
  const [state, formAction, isPending] = useActionState(
    changePasswordAction,
    initialState,
  );

  return (
    <form action={formAction} className="brand-form">
      {state.error ? (
        <p className="form-message form-message-error" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="form-message form-message-success" role="status">
          {state.success}
        </p>
      ) : null}

      <PasswordField autoComplete="current-password" label="Password saat ini" name="currentPassword" />
      <PasswordField autoComplete="new-password" label="Password baru" name="newPassword" />
      <PasswordField autoComplete="new-password" label="Konfirmasi password baru" name="confirmPassword" />

      <p className="password-help">
        Gunakan minimal 12 karakter. Setelah password berubah, seluruh session lain akan dicabut.
      </p>

      <button
        className="brand-primary-button"
        disabled={isPending}
        type="submit"
      >
      <KeyRound aria-hidden="true" size={16} /> {isPending ? "Menyimpan..." : "Ubah Password"}
      </button>
    </form>
  );
}

function PasswordField({
  autoComplete,
  label,
  name,
}: {
  autoComplete: string;
  label: string;
  name: string;
}) {
  return (
    <div className="form-field">
      <label htmlFor={name}>{label}</label>
      <input
        autoComplete={autoComplete}
        className="brand-input"
        id={name}
        name={name}
        required
        type="password"
      />
    </div>
  );
}
