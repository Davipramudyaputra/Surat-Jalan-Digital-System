import "server-only";

import { z } from "zod";

const databaseUrlSchema = z
  .string()
  .url("DATABASE_URL harus berupa URL yang valid.")
  .refine(
    (value) => {
      const protocol = new URL(value).protocol;
      return protocol === "postgresql:" || protocol === "postgres:";
    },
    "DATABASE_URL harus menggunakan protokol PostgreSQL.",
  );

const serverEnvironmentSchema = z.object({
  POSTGRES_DB: z.string().trim().min(1, "POSTGRES_DB wajib diisi."),
  POSTGRES_USER: z.string().trim().min(1, "POSTGRES_USER wajib diisi."),
  POSTGRES_PASSWORD: z.string().min(1, "POSTGRES_PASSWORD wajib diisi."),
  POSTGRES_PORT: z.coerce
    .number()
    .int("POSTGRES_PORT harus berupa bilangan bulat.")
    .min(1, "POSTGRES_PORT harus lebih besar dari 0.")
    .max(65_535, "POSTGRES_PORT tidak valid."),
  DATABASE_URL: databaseUrlSchema,
});

const parsedEnvironment = serverEnvironmentSchema.safeParse({
  POSTGRES_DB: process.env.POSTGRES_DB,
  POSTGRES_USER: process.env.POSTGRES_USER,
  POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD,
  POSTGRES_PORT: process.env.POSTGRES_PORT,
  DATABASE_URL: process.env.DATABASE_URL,
});

if (!parsedEnvironment.success) {
  const invalidFields = [
    ...new Set(
      parsedEnvironment.error.issues.map(
        (issue) => String(issue.path[0] ?? "environment"),
      ),
    ),
  ];

  throw new Error(
    `Konfigurasi environment server tidak valid. Periksa: ${invalidFields.join(", ")}.`,
  );
}

export const env = Object.freeze(parsedEnvironment.data);
