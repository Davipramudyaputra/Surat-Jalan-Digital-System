/**
 * Shape audit event untuk detail UI. `beforeData`/`afterData`/`metadata`
 * adalah objek JSON yang telah di-decode dari kolom JSON.
 */
export type AuditEventDetail = {
  id: string;
  entityType: string;
  entityId: string;
  entityLabelSnapshot: string | null;
  action: string;
  actorId: string | null;
  actorNameSnapshot: string | null;
  actorRoleSnapshot: string | null;
  occurredAt: Date;
  source: string;
  requestId: string | null;
  batchId: string | null;
  changedFields: string[] | null;
  beforeData: Record<string, unknown> | null;
  afterData: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
};
