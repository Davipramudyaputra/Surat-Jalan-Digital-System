import { prisma } from "@/lib/prisma";
import { ACTIVE_DN_FILTER } from "@/features/soft-delete/active";
import { calculatePOStats } from "../utils/stats";

export async function attachPOStats<T extends { id: string, _count?: { deliveryNotes: number } }>(pos: T[]) {
  const poIds = pos.map(p => p.id);
  if (poIds.length === 0) return [];

  const deliveryNotes = await prisma.deliveryNote.findMany({
    where: { purchaseOrderId: { in: poIds }, ...ACTIVE_DN_FILTER },
    select: {
      purchaseOrderId: true,
      printStatus: true,
      _count: { select: { items: true } },
    },
  });

  const aggregates = new Map<
    string,
    { total: number; printed: number; items: number }
  >();

  for (const deliveryNote of deliveryNotes) {
    const aggregate = aggregates.get(deliveryNote.purchaseOrderId) ?? {
      total: 0,
      printed: 0,
      items: 0,
    };
    aggregate.total += 1;
    aggregate.items += deliveryNote._count.items;
    if (deliveryNote.printStatus === "PRINTED") {
      aggregate.printed += 1;
    }
    aggregates.set(deliveryNote.purchaseOrderId, aggregate);
  }

  return pos.map(po => {
    const aggregate = aggregates.get(po.id) ?? {
      total: po._count?.deliveryNotes ?? 0,
      printed: 0,
      items: 0,
    };
    return {
      ...po,
      stats: calculatePOStats(
        aggregate.total,
        aggregate.printed,
        aggregate.items,
      )
    };
  });
}

// Single PO attachment
export async function attachSinglePOStats<T extends { id: string, _count?: { deliveryNotes: number } }>(po: T) {
  const result = await attachPOStats([po]);
  return result[0];
}
