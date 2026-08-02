"use client";

import { useActionState } from "react";

import { changePasswordAction } from "../actions";

const initialState = { error: "", success: "" };

export function ChangePasswordForm() {
  const [state, formAction, isPending] = useActionState(
    changePasswordAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-5">
      {state.error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700" role="status">
          {state.success}
        </p>
      ) : null}

      <PasswordField autoComplete="current-password" label="Password saat ini" name="currentPassword" />
      <PasswordField autoComplete="new-password" label="Password baru" name="newPassword" />
      <PasswordField autoComplete="new-password" label="Konfirmasi password baru" name="confirmPassword" />

      <p className="text-xs leading-5 text-gray-500">
        Gunakan minimal 12 karakter. Setelah password berubah, seluruh session lain akan dicabut.
      </p>

      <button
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Menyimpan..." : "Ubah Password"}
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
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700" htmlFor={name}>{label}</label>
      <input
        autoComplete={autoComplete}
        className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
        id={name}
        name={name}
        required
        type="password"
      />
    </div>
  );
}
