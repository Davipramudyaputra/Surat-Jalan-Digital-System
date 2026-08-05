"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

import {
  AUDIT_ACTION,
  AUDIT_ENTITY_TYPE,
  AUDIT_SOURCE,
} from "@/features/audit/constants";
import { actorFromSession } from "@/features/audit/lib/actor";
import { recordAuditEvent } from "@/features/audit/services/audit-service";
import { prisma } from "@/lib/prisma";
import { createSession, destroySession, getSession } from "@/lib/session";
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

    // Audit: hanya login berhasil. Actor dari user yang berhasil login.
    await recordAuditEvent({
      actor: {
        id: user.id,
        name: user.username,
        identifier: user.username,
        role: user.role,
      },
      entity: {
        type: AUDIT_ENTITY_TYPE.USER_AUTH,
        id: user.id,
        label: user.username,
      },
      action: AUDIT_ACTION.LOGIN,
      source: AUDIT_SOURCE.AUTH,
    });
  } catch {
    console.error("Login gagal karena kesalahan internal.");
    return { error: "Terjadi kesalahan. Silakan coba kembali." };
  }

  redirect("/dashboard");
}

export async function logoutAction() {
  const session = await getSession();
  if (session) {
    await recordAuditEvent({
      actor: {
        id: session.user.id,
        name: session.user.username,
        identifier: session.user.username,
        role: session.user.role,
      },
      entity: {
        type: AUDIT_ENTITY_TYPE.USER_AUTH,
        id: session.user.id,
        label: session.user.username,
      },
      action: AUDIT_ACTION.LOGOUT,
      source: AUDIT_SOURCE.AUTH,
    });
  }

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

    // Audit: tidak menyimpan password lama, baru, maupun hash.
    await recordAuditEvent({
      actor: actorFromSession(session),
      entity: {
        type: AUDIT_ENTITY_TYPE.USER_AUTH,
        id: session.user.id,
        label: session.user.username,
      },
      action: AUDIT_ACTION.PASSWORD_CHANGE,
      source: AUDIT_SOURCE.AUTH,
      metadata: { status: "success" },
    });

    return {
      error: "",
      success: "Password berhasil diperbarui. Session lain telah dicabut.",
    };
  } catch {
    console.error("Perubahan password gagal karena kesalahan internal.");
    return { error: "Password tidak dapat diperbarui saat ini.", success: "" };
  }
}
