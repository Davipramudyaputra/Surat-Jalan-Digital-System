import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

import { AUDIT_ACTION, AUDIT_ENTITY_TYPE } from "../constants";
import type { AuditHistorySearchParams } from "../schemas";

function isValidDate(value: string): boolean {
  return !Number.isNaN(new Date(value).getTime());
}

/**
 * Query Global History dengan pagination server-side, filter, dan stable sort.
 * Hanya mengambil field yang diperlukan untuk list (tidak memuat before/after
 * besar kecuali dibutuhkan).
 */
export async function queryAuditHistory(
  params: AuditHistorySearchParams,
) {
  const { q, actor, action, entity, from, to, page, limit } = params;

  const where: Prisma.AuditEventWhereInput = {};

  if (action) {
    where.action = action;
  }
  if (entity) {
    where.entityType = entity;
  }
  if (actor) {
    where.OR = [
      { actorNameSnapshot: { contains: actor, mode: "insensitive" } },
      { actorIdentifierSnapshot: { contains: actor, mode: "insensitive" } },
    ];
  }

  const dateClauses: Prisma.AuditEventWhereInput[] = [];
  if (from && isValidDate(from)) {
    dateClauses.push({ occurredAt: { gte: new Date(from) } });
  }
  if (to && isValidDate(to)) {
    dateClauses.push({ occurredAt: { lte: new Date(to) } });
  }
  if (dateClauses.length === 1) {
    Object.assign(where, dateClauses[0]);
  } else if (dateClauses.length === 2) {
    where.AND = dateClauses;
  }

  if (q) {
    const terms = q.trim().replace(/\s+/g, " ").split(" ");
    const qAnd: Prisma.AuditEventWhereInput[] = terms.map((term) => ({
      OR: [
        { entityLabelSnapshot: { contains: term, mode: "insensitive" } },
        { entityId: { contains: term, mode: "insensitive" } },
        { actorNameSnapshot: { contains: term, mode: "insensitive" } },
      ],
    }));
    where.AND = where.AND ? [...(where.AND as []), ...qAnd] : qAnd;
  }

  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    prisma.auditEvent.findMany({
      where,
      select: {
        id: true,
        entityType: true,
        entityId: true,
        entityLabelSnapshot: true,
        action: true,
        actorNameSnapshot: true,
        actorRoleSnapshot: true,
        occurredAt: true,
        source: true,
        changedFields: true,
        batchId: true,
      },
      orderBy: [{ occurredAt: "desc" }, { id: "desc" }],
      skip,
      take: limit,
    }),
    prisma.auditEvent.count({ where }),
  ]);

  return {
    data: data.map((event) => ({
      id: event.id,
      entityType: event.entityType,
      entityId: event.entityId,
      entityLabelSnapshot: event.entityLabelSnapshot,
      action: event.action,
      actorNameSnapshot: event.actorNameSnapshot,
      actorRoleSnapshot: event.actorRoleSnapshot,
      occurredAt: event.occurredAt,
      source: event.source,
      changedFields: Array.isArray(event.changedFields)
        ? (event.changedFields as string[])
        : null,
      batchId: event.batchId,
    })),
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Memuat payload detail satu audit event. Read-only.
 */
export async function getAuditEventById(id: string) {
  return prisma.auditEvent.findUnique({
    where: { id },
  });
}

/**
 * Contextual history untuk satu entity. Menggunakan index (entityType,
 * entityId) agar efisien dan tidak memuat seluruh global history.
 */
export async function queryAuditHistoryForEntity(
  entityType: string,
  entityId: string,
  limit = 15,
) {
  const events = await prisma.auditEvent.findMany({
    where: { entityType, entityId },
    select: {
      id: true,
      entityType: true,
      entityId: true,
      entityLabelSnapshot: true,
      action: true,
      actorNameSnapshot: true,
      actorRoleSnapshot: true,
      occurredAt: true,
      source: true,
      changedFields: true,
      beforeData: true,
      afterData: true,
      metadata: true,
      batchId: true,
    },
    orderBy: [{ occurredAt: "desc" }, { id: "desc" }],
    take: limit,
  });

  return events.map((event) => ({
    id: event.id,
    entityType: event.entityType,
    entityId: event.entityId,
    entityLabelSnapshot: event.entityLabelSnapshot,
    action: event.action,
    actorNameSnapshot: event.actorNameSnapshot,
    actorRoleSnapshot: event.actorRoleSnapshot,
    occurredAt: event.occurredAt,
    source: event.source,
    changedFields: Array.isArray(event.changedFields)
      ? (event.changedFields as string[])
      : null,
    beforeData: (event.beforeData as Record<string, unknown>) ?? null,
    afterData: (event.afterData as Record<string, unknown>) ?? null,
    metadata: (event.metadata as Record<string, unknown>) ?? null,
    batchId: event.batchId,
  }));
}

export async function hasDeliveryNotePdfExport(
  deliveryNoteId: string,
): Promise<boolean> {
  const event = await prisma.auditEvent.findFirst({
    where: {
      entityType: AUDIT_ENTITY_TYPE.DELIVERY_NOTE,
      entityId: deliveryNoteId,
      action: AUDIT_ACTION.PDF_EXPORT,
    },
    select: { id: true },
  });

  return event !== null;
}
