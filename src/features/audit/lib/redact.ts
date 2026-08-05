/**
 * Redaction utility — Phase 5.
 *
 * Menyaring field sensitif dari snapshot audit sebelum disimpan. Bersifat
 * rekursif, case-insensitive, dan tidak memodifikasi object input.
 */

const SENSITIVE_KEYS: ReadonlySet<string> = new Set([
  "password",
  "passwordhash",
  "passwordconfirmation",
  "currentpassword",
  "newpassword",
  "sessiontoken",
  "refreshtoken",
  "token",
  "apikey",
  "secret",
  "privatekey",
  "databaseurl",
  "authsecret",
  "sessionsecret",
  "cookie",
  "authorization",
  "credential",
  "accesskey",
  "clientsecret",
]);

const REDACTED_PLACEHOLDER = "[REDACTED]";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}

function shouldRedact(key: string): boolean {
  return SENSITIVE_KEYS.has(key.toLocaleLowerCase("en-US"));
}

/**
 * Mengembalikan salinan baru dari `input` dengan seluruh field sensitif
 * (rekursif) diganti placeholder. Object input tidak dimodifikasi.
 */
export function redactSensitiveData(input: unknown): unknown {
  if (Array.isArray(input)) {
    return input.map((item) => redactSensitiveData(item));
  }

  if (isPlainObject(input)) {
    const output: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
      if (shouldRedact(key)) {
        output[key] = REDACTED_PLACEHOLDER;
      } else {
        output[key] = redactSensitiveData(value);
      }
    }
    return output;
  }

  return input;
}

/**
 * Membantu memfilter snapshot Prisma menjadi objek JSON polos yang aman,
 * lalu menerapkan redaction. Nilai yang tidak dapat di-serialisasi dijatuhkan.
 */
export function toSafeJson(value: unknown): Record<string, unknown> | null {
  if (value === undefined || value === null) {
    return null;
  }

  try {
    return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
  } catch {
    return null;
  }
}
