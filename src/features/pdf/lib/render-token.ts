import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Render token untuk internal PDF route.
 *
 * Token ini adalah HMAC-SHA256 signature atas payload (deliveryNoteId,
 * paper profile, orientation, custom dims) + timestamp, ditandatangani dengan
 * secret server. Token bersifat ephemeral (expiry) dan single-purpose.
 *
 * Tidak ada URL arbitrer dari client; token selalu dibentuk server-side.
 */

const TOKEN_TTL_MS = 60_000; // 60 detik

function getSecret(): string {
  const secret = process.env.PDF_RENDER_SECRET;
  if (!secret) {
    throw new Error("PDF_RENDER_SECRET belum dikonfigurasi.");
  }
  return secret;
}

export type RenderTokenPayload = {
  deliveryNoteId: string;
  paper: string;
  orientation: string;
  width?: number;
  height?: number;
  margin?: number;
  exp: number;
};

function serialize(payload: RenderTokenPayload): string {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function sign(data: string): string {
  return createHmac("sha256", getSecret()).update(data).digest("base64url");
}

/**
 * Membuat token render internal. `exp` dihitung dari waktu server.
 */
export function createRenderToken(
  payload: Omit<RenderTokenPayload, "exp">,
): string {
  const full: RenderTokenPayload = { ...payload, exp: Date.now() + TOKEN_TTL_MS };
  const body = serialize(full);
  const sig = sign(body);
  return `${body}.${sig}`;
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

/**
 * Memvalidasi dan memparsing token render. Mengembalikan payload atau null.
 */
export function verifyRenderToken(token: string): RenderTokenPayload | null {
  const parts = token.split(".");
  if (parts.length !== 2) {
    return null;
  }
  const [body, sig] = parts;
  const expected = sign(body);
  if (!safeEqual(expected, sig)) {
    return null;
  }

  let payload: RenderTokenPayload;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  if (!payload || typeof payload.exp !== "number" || payload.exp < Date.now()) {
    return null;
  }
  if (!payload.deliveryNoteId || !payload.paper || !payload.orientation) {
    return null;
  }

  return payload;
}
