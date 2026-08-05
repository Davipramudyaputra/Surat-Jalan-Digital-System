import "server-only";

import { Prisma } from "@/generated/prisma/client";
import type { PrismaClient } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

import {
  AUDIT_ACTION,
  type AuditAction,
  type AuditEntityType,
  type AuditSource,
} from "../constants";
import { redactSensitiveData, toSafeJson } from "../lib/redact";

/**
 * Actor audit berasal dari server session. Client tidak dapat mengirim actor.
 */
export type AuditActor = {
  id: string | null;
  name: string;
  identifier: string;
  role: string;
};

export type AuditEntityRef = {
  type: AuditEntityType;
  id: string;
  label?: string | null;
};

export type AuditEventInput = {
  actor: AuditActor;
  entity: AuditEntityRef;
  action: AuditAction;
  source: AuditSource;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  requestId?: string | null;
  batchId?: string | null;
};

/** Abstraksi Prisma transaction client (agar audit dapat berjalan di dalam transaction). */
export type AuditDbClient = Pick<
  PrismaClient,
  "auditEvent"
>;

const DEFAULT_DB: AuditDbClient = prisma;

function toInputJson(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  try {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  } catch {
    return undefined;
  }
}

/**
 * Menghitung daftar field yang berubah antara before dan after.
 * `after` sebagai dasar; hanya field yang benar-benar berbeda yang dihitung.
 * Nilai yang sama atau tidak berubah tidak dimasukkan.
 */
export function computeChangedFields(
  before: Record<string, unknown> | null | undefined,
  after: Record<string, unknown> | null | undefined,
): string[] {
  const changed: string[] = [];
  const beforeObj = before ?? {};
  const afterObj = after ?? {};

  for (const key of new Set([...Object.keys(beforeObj), ...Object.keys(afterObj)])) {
    const beforeValue = beforeObj[key];
    const afterValue = afterObj[key];
    if (JSON.stringify(beforeValue) !== JSON.stringify(afterValue)) {
      changed.push(key);
    }
  }

  return changed;
}

function actorFallback(actor: AuditActor | null) {
  if (actor) {
    return {
      actorId: actor.id,
      actorNameSnapshot: actor.name,
      actorIdentifierSnapshot: actor.identifier,
      actorRoleSnapshot: actor.role,
    };
  }
  return {
    actorId: null,
    actorNameSnapshot: "SYSTEM",
    actorIdentifierSnapshot: null,
    actorRoleSnapshot: null,
  };
}

/**
 * Mencatat satu audit event. Digunakan baik di dalam transaction (dengan
 * `tx.auditEvent.create`) maupun berdiri sendiri (dengan `prisma` global).
 * Timestamp `occurredAt` selalu waktu server.
 */
export async function recordAuditEvent(
  input: AuditEventInput,
  db: AuditDbClient = DEFAULT_DB,
): Promise<void> {
  const safeBefore = toSafeJson(input.before);
  const safeAfter = toSafeJson(input.after);
  const safeMetadata = toSafeJson(input.metadata);
  const safeChanged = safeAfter
    ? computeChangedFields(safeBefore, safeAfter)
    : (input.before !== undefined && input.before !== null
        ? Object.keys(safeBefore ?? {})
        : []);

  // Redaksi hanya diterapkan pada snapshot non-teknis (metadata/snapshot).
  const redactedMetadata = redactSensitiveData(safeMetadata) as
    | Record<string, unknown>
    | null
    | undefined;
  const redactedBefore = redactSensitiveData(safeBefore) as
    | Record<string, unknown>
    | null
    | undefined;
  const redactedAfter = redactSensitiveData(safeAfter) as
    | Record<string, unknown>
    | null
    | undefined;

  const actorSnapshot = actorFallback(input.actor);

  await db.auditEvent.create({
    data: {
      entityType: input.entity.type,
      entityId: input.entity.id,
      entityLabelSnapshot: input.entity.label ?? null,
      action: input.action,
      actorId: actorSnapshot.actorId,
      actorNameSnapshot: actorSnapshot.actorNameSnapshot,
      actorIdentifierSnapshot: actorSnapshot.actorIdentifierSnapshot,
      actorRoleSnapshot: actorSnapshot.actorRoleSnapshot,
      occurredAt: new Date(),
      source: input.source,
      requestId: input.requestId ?? null,
      batchId: input.batchId ?? null,
      changedFields: toInputJson(redactSensitiveData(safeChanged)),
      beforeData: toInputJson(redactedBefore),
      afterData: toInputJson(redactedAfter),
      metadata: toInputJson(redactedMetadata),
    },
  });
}

export { AUDIT_ACTION };
