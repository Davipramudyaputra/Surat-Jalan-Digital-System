"use server";

import "server-only";

import { requireAdmin } from "@/lib/session";
import { getAuditEventById } from "../queries";
import type { AuditEventDetail } from "../components/types";

export async function getAuditEventDetailAction(
  id: string,
): Promise<AuditEventDetail | null> {
  try {
    await requireAdmin();
  } catch {
    return null;
  }

  const event = await getAuditEventById(id);
  if (!event) {
    return null;
  }

  return {
    id: event.id,
    entityType: event.entityType,
    entityId: event.entityId,
    entityLabelSnapshot: event.entityLabelSnapshot,
    action: event.action,
    actorId: event.actorId,
    actorNameSnapshot: event.actorNameSnapshot,
    actorRoleSnapshot: event.actorRoleSnapshot,
    occurredAt: event.occurredAt,
    source: event.source,
    requestId: event.requestId,
    batchId: event.batchId,
    changedFields: Array.isArray(event.changedFields)
      ? (event.changedFields as string[])
      : null,
    beforeData: (event.beforeData as Record<string, unknown>) ?? null,
    afterData: (event.afterData as Record<string, unknown>) ?? null,
    metadata: (event.metadata as Record<string, unknown>) ?? null,
  };
}
