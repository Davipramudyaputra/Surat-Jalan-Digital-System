"use client";

import { useActionState } from "react";
import { useState } from "react";
import { loginAction } from "../actions";
import { Eye, EyeOff, LockKeyhole, LogIn, UserRound } from "lucide-react";

const initialState = {
  error: "",
};

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="login-card">
      <div className="login-card-heading">
        <p>Selamat datang kembali</p>
        <h1>Masuk ke Sistem</h1>
        <span className="heading-accent" aria-hidden="true" />
        <p>
          Sistem Surat Jalan Digital<br />CV. Pramudya Putra
        </p>
      </div>

      <form action={formAction} className="login-form">
        {state?.error && (
          <div className="form-message form-message-error" role="alert">
            {state.error}
          </div>
        )}

        <div className="form-field">
          <label
            htmlFor="username"
          >
            Username atau Email
          </label>
          <div className="input-with-icon">
            <UserRound aria-hidden="true" size={18} />
            <input
              id="username"
              name="username"
              type="text"
              required
              autoComplete="username"
              disabled={isPending}
            />
          </div>
        </div>

        <div className="form-field">
          <label
            htmlFor="password"
          >
            Password
          </label>
          <div className="input-with-icon input-with-action">
            <LockKeyhole aria-hidden="true" size={18} />
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              disabled={isPending}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isPending}
              aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              title={showPassword ? "Sembunyikan password" : "Tampilkan password"}
            >
              {showPassword ? <EyeOff aria-hidden="true" size={18} /> : <Eye aria-hidden="true" size={18} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="login-submit"
        >
          <LogIn aria-hidden="true" size={18} />
          {isPending ? "Masuk..." : "Masuk"}
        </button>
      </form>
    </div>
  );
}
