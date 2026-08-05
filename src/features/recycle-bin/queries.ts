import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type RecycleBinPOQuery = {
  q?: string;
  page?: number;
  limit?: number;
};

export type RecycleBinDNQuery = {
  q?: string;
  page?: number;
  limit?: number;
};

export async function queryDeletedPurchaseOrders(params: RecycleBinPOQuery) {
  const { q, page = 1, limit = 20 } = params;
  const where: Prisma.PurchaseOrderWhereInput = { deletedAt: { not: null } };

  if (q) {
    where.OR = [
      { poNumber: { contains: q, mode: "insensitive" } },
      { companyCode: { contains: q, mode: "insensitive" } },
      { companyName: { contains: q, mode: "insensitive" } },
    ];
  }

  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    prisma.purchaseOrder.findMany({
      where,
      include: {
        deletedBy: { select: { username: true } },
        deliveryNotes: {
          where: { deletedAt: { not: null } },
          select: { _count: { select: { items: true } } },
        },
      },
      orderBy: [{ deletedAt: "desc" }, { id: "desc" }],
      skip,
      take: limit,
    }),
    prisma.purchaseOrder.count({ where }),
  ]);

  return {
    data: data.map((po) => {
      const itemCount = po.deliveryNotes.reduce(
        (acc, dn) => acc + dn._count.items,
        0,
      );
      const deliveryNoteCount = po.deliveryNotes.length;
      // Hapus relasi deliveryNotes dari hasil agar tidak bocor ke list.
      const rest = {
        id: po.id,
        companyCode: po.companyCode,
        companyName: po.companyName,
        poNumber: po.poNumber,
        normalizedPoNumber: po.normalizedPoNumber,
        period: po.period,
        lastSourceUploadId: po.lastSourceUploadId,
        deletedAt: po.deletedAt,
        deletedById: po.deletedById,
        deletionReason: po.deletionReason,
        trashBatchId: po.trashBatchId,
        createdAt: po.createdAt,
        updatedAt: po.updatedAt,
        deletedBy: po.deletedBy,
      };
      return { ...rest, itemCount, deliveryNoteCount };
    }),
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
}

export async function queryDeletedDeliveryNotes(params: RecycleBinDNQuery) {
  const { q, page = 1, limit = 20 } = params;
  const where: Prisma.DeliveryNoteWhereInput = { deletedAt: { not: null } };

  if (q) {
    where.OR = [
      { uniqueCode: { contains: q, mode: "insensitive" } },
      { branchName: { contains: q, mode: "insensitive" } },
      { documentNumber: { contains: q, mode: "insensitive" } },
      {
        purchaseOrder: {
          poNumber: { contains: q, mode: "insensitive" },
        },
      },
    ];
  }

  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    prisma.deliveryNote.findMany({
      where,
      include: {
        purchaseOrder: {
          select: {
            id: true,
            poNumber: true,
            companyCode: true,
            companyName: true,
            deletedAt: true,
          },
        },
        deletedBy: { select: { username: true } },
        _count: { select: { items: true } },
      },
      orderBy: [{ deletedAt: "desc" }, { id: "desc" }],
      skip,
      take: limit,
    }),
    prisma.deliveryNote.count({ where }),
  ]);

  return {
    data,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
}

export async function getDeletedPurchaseOrder(id: string) {
  return prisma.purchaseOrder.findFirst({
    where: { id, deletedAt: { not: null } },
    include: {
      deletedBy: { select: { username: true } },
      deliveryNotes: {
        where: { deletedAt: { not: null } },
        include: {
          _count: { select: { items: true } },
        },
        orderBy: { branchName: "asc" },
      },
    },
  });
}

export async function getDeletedDeliveryNote(id: string) {
  return prisma.deliveryNote.findFirst({
    where: { id, deletedAt: { not: null } },
    include: {
      purchaseOrder: {
        select: {
          id: true,
          poNumber: true,
          companyCode: true,
          companyName: true,
          deletedAt: true,
        },
      },
      deletedBy: { select: { username: true } },
      items: true,
    },
  });
}
