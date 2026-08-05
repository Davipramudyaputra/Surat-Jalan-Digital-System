import { AuditHistoryList } from "./AuditHistoryList";
import { getAuditEventDetailAction } from "../actions/get-audit-event";
import { queryAuditHistoryForEntity } from "../queries";

export async function ContextualHistorySection({
  entityType,
  entityId,
  limit = 15,
  title = "History",
  description = "Riwayat perubahan pada data ini.",
}: {
  entityType: string;
  entityId: string;
  limit?: number;
  title?: string;
  description?: string;
}) {
  const events = await queryAuditHistoryForEntity(entityType, entityId, limit);

  return (
    <section className="brand-card contextual-history-card">
      <div className="brand-section-heading">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>
      <AuditHistoryList
        events={events}
        onLoadDetail={getAuditEventDetailAction}
      />
      {events.length >= limit ? (
        <p className="contextual-history-note">
          Menampilkan {limit} event terbaru. Gunakan halaman History untuk
          melihat seluruhnya.
        </p>
      ) : null}
    </section>
  );
}
