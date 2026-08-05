import { describe, expect, it } from "vitest";

import { redactSensitiveData, toSafeJson } from "./redact";

describe("redactSensitiveData", () => {
  it("mengganti field password secara case-insensitive", () => {
    const result = redactSensitiveData({
      password: "abc",
      Password: "def",
      PASSWORD: "ghi",
    });
    expect(result).toEqual({
      password: "[REDACTED]",
      Password: "[REDACTED]",
      PASSWORD: "[REDACTED]",
    });
  });

  it("menangani nested object secara aman", () => {
    const result = redactSensitiveData({
      user: {
        name: "Admin",
        credentials: {
          sessionToken: "tok",
          refreshToken: "ref",
        },
      },
      poNumber: "678/PPU",
    });
    expect(result).toEqual({
      user: {
        name: "Admin",
        credentials: {
          sessionToken: "[REDACTED]",
          refreshToken: "[REDACTED]",
        },
      },
      poNumber: "678/PPU",
    });
  });

  it("menangani array", () => {
    const result = redactSensitiveData([
      { token: "a", name: "x" },
      { token: "b", name: "y" },
    ]);
    expect(result).toEqual([
      { token: "[REDACTED]", name: "x" },
      { token: "[REDACTED]", name: "y" },
    ]);
  });

  it("tidak memodifikasi object input", () => {
    const input = { password: "secret", companyName: "PT A" };
    const snapshot = structuredClone(input);
    redactSensitiveData(input);
    expect(input).toEqual(snapshot);
  });

  it("meredact daftar field sensitif lain", () => {
    const result = redactSensitiveData({
      apiKey: "k",
      authSecret: "s",
      databaseUrl: "postgres://u:p@h/db",
      cookie: "c",
      authorization: "Bearer x",
      privateKey: "pk",
      sessionToken: "st",
    });
    expect(result).toEqual({
      apiKey: "[REDACTED]",
      authSecret: "[REDACTED]",
      databaseUrl: "[REDACTED]",
      cookie: "[REDACTED]",
      authorization: "[REDACTED]",
      privateKey: "[REDACTED]",
      sessionToken: "[REDACTED]",
    });
  });
});

describe("toSafeJson", () => {
  it("mengubah object menjadi JSON polos", () => {
    expect(toSafeJson({ a: 1, b: "x" })).toEqual({ a: 1, b: "x" });
  });

  it("mengembalikan null untuk undefined/null", () => {
    expect(toSafeJson(undefined)).toBeNull();
    expect(toSafeJson(null)).toBeNull();
  });

  it("mengembalikan null untuk nilai yang tidak dapat diserialisasi", () => {
    expect(toSafeJson(() => undefined)).toBeNull();
  });
});
