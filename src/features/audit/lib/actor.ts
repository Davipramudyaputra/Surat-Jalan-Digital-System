import "server-only";

import type { AuditActor } from "../services/audit-service";

/**
 * Membangun AuditActor dari session server. Nilai yang disimpan adalah
 * snapshot (tidak bergantung pada state user saat ini).
 */
export function actorFromSession(session: {
  user: { id: string; username: string; role: string };
}): AuditActor {
  return {
    id: session.user.id,
    name: session.user.username,
    identifier: session.user.username,
    role: session.user.role,
  };
}
