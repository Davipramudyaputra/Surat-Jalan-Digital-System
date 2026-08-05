import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { ACTIVE_DN_FILTER } from "@/features/soft-delete/active";
import { DeliveryNoteSearchParams } from "../schemas";

export async function getDeliveryNotes(params: DeliveryNoteSearchParams) {
  const { q, status, page, limit, purchaseOrderId } = params;

  const where: Prisma.DeliveryNoteWhereInput = { ...ACTIVE_DN_FILTER };

  if (purchaseOrderId) {
    where.purchaseOrderId = purchaseOrderId;
  }

  if (status === "not-printed") {
    where.printStatus = "NOT_PRINTED";
  } else if (status === "printed") {
    where.printStatus = "PRINTED";
  }

  if (q) {
    const searchTerms = q.trim().replace(/\s+/g, " ").split(" ");

    // We want all terms to match somewhere
    where.AND = searchTerms.map(term => ({
      OR: [
        { branchName: { contains: term, mode: "insensitive" } },
        { normalizedBranchName: { contains: term, mode: "insensitive" } },
        { originalBranchName: { contains: term, mode: "insensitive" } },
        { uniqueCode: { contains: term, mode: "insensitive" } },
        { documentNumber: { contains: term, mode: "insensitive" } },
        { recipientCompanyName: { contains: term, mode: "insensitive" } },
        {
          purchaseOrder: {
            OR: [
              { poNumber: { contains: term, mode: "insensitive" } },
              { normalizedPoNumber: { contains: term, mode: "insensitive" } },
              { companyCode: { contains: term, mode: "insensitive" } },
              { companyName: { contains: term, mode: "insensitive" } },
            ]
          }
        }
      ]
    }));
  }

  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    prisma.deliveryNote.findMany({
      where,
      include: {
        purchaseOrder: true,
        _count: {
          select: { items: true }
        }
      },
      orderBy: [
        { purchaseOrder: { createdAt: "desc" } },
        { branchName: "asc" },
        { id: "asc" }
      ],
      skip,
      take: limit,
    }),
    prisma.deliveryNote.count({ where })
  ]);

  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
}

export async function getDeliveryNoteById(id: string) {
  return prisma.deliveryNote.findFirst({
    where: { id, ...ACTIVE_DN_FILTER },
    include: {
      purchaseOrder: true,
      items: {
        orderBy: { sortOrder: "asc" }
      }
    }
  });
}

export async function getDeliveryNoteForPreview(id: string) {
  return prisma.deliveryNote.findFirst({
    where: { id, ...ACTIVE_DN_FILTER },
    select: {
      id: true,
      purchaseOrderId: true,
      uniqueCode: true,
      documentNumber: true,
      documentDate: true,
      recipientCompanyName: true,
      branchName: true,
      vehicleName: true,
      vehicleNumber: true,
      additionalPoNumber: true,
      recipientName: true,
      printStatus: true,
      firstPrintedAt: true,
      lastPrintedAt: true,
      printCount: true,
      updatedAt: true,
      purchaseOrder: {
        select: {
          companyCode: true,
          poNumber: true,
        },
      },
      items: {
        select: {
          id: true,
          quantity: true,
          unit: true,
          displayProductName: true,
          originalProductName: true,
          description: true,
          sortOrder: true,
        },
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      },
    },
  });
}
