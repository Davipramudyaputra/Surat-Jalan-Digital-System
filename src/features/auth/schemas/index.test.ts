import { describe, expect, it } from "vitest";

import { changePasswordSchema, loginSchema } from ".";

describe("auth schemas", () => {
  it("memerlukan username dan password untuk login", () => {
    expect(loginSchema.safeParse({ username: "", password: "" }).success).toBe(false);
  });

  it("menolak password baru pendek atau konfirmasi yang berbeda", () => {
    expect(changePasswordSchema.safeParse({
      currentPassword: "password-lama",
      newPassword: "pendek",
      confirmPassword: "berbeda",
    }).success).toBe(false);
  });

  it("menerima perubahan password yang kuat dan cocok", () => {
    expect(changePasswordSchema.safeParse({
      currentPassword: "password-lama",
      newPassword: "Password-Baru-2026",
      confirmPassword: "Password-Baru-2026",
    }).success).toBe(true);
  });
});
