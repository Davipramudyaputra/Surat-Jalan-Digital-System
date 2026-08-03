"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { createSession, destroySession } from "@/lib/session";
import { requireAdmin } from "@/lib/session";
import { changePasswordSchema, loginSchema } from "../schemas";

export async function loginAction(prevState: { error: string }, formData: FormData) {
  const data = Object.fromEntries(formData.entries());
  const parsed = loginSchema.safeParse(data);

  if (!parsed.success) {
    return { error: "Email atau username dan password wajib diisi." };
  }

  const { username, password } = parsed.data;

  try {
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user || !user.isActive) {
      return { error: "Username atau password salah." };
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      return { error: "Username atau password salah." };
    }

    await createSession(user.id);
  } catch {
    console.error("Login gagal karena kesalahan internal.");
    return { error: "Terjadi kesalahan. Silakan coba kembali." };
  }

  redirect("/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

type PasswordActionState = { error: string; success: string };

export async function changePasswordAction(
  _prevState: PasswordActionState,
  formData: FormData,
): Promise<PasswordActionState> {
  let session;
  try {
    session = await requireAdmin();
  } catch {
    return { error: "Sesi admin tidak valid. Silakan login kembali.", success: "" };
  }

  const parsed = changePasswordSchema.safeParse(
    Object.fromEntries(formData.entries()),
  );
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Data password tidak valid.",
      success: "",
    };
  }

  const validCurrentPassword = await bcrypt.compare(
    parsed.data.currentPassword,
    session.user.passwordHash,
  );
  if (!validCurrentPassword) {
    return { error: "Password saat ini tidak sesuai.", success: "" };
  }

  try {
    const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
    await prisma.$transaction([
      prisma.user.update({
        where: { id: session.user.id },
        data: { passwordHash },
      }),
      prisma.session.deleteMany({
        where: { userId: session.user.id, id: { not: session.id } },
      }),
    ]);
    return {
      error: "",
      success: "Password berhasil diperbarui. Session lain telah dicabut.",
    };
  } catch {
    console.error("Perubahan password gagal karena kesalahan internal.");
    return { error: "Password tidak dapat diperbarui saat ini.", success: "" };
  }
}
