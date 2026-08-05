import type { AuditActor } from "../services/audit-service";

/**
 * Actor audit untuk test unit/database (bukan dari session produksi).
 *
 * `id` bernilai null agar tidak melanggar foreign key ke tabel User. Snapshot
 * (name/identifier/role) tetap tersimpan seperti actor dari session server.
 */
export const TEST_AUDIT_ACTOR: AuditActor = {
  id: null,
  name: "test-admin",
  identifier: "test-admin",
  role: "ADMIN",
};
