import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { DeliveryNoteSearchParams } from "../schemas";

export async function getDeliveryNotes(params: DeliveryNoteSearchParams) {
  const { q, status, page, limit, purchaseOrderId } = params;

  const where: Prisma.DeliveryNoteWhereInput = {};

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
  return prisma.deliveryNote.findUnique({
    where: { id },
    include: {
      purchaseOrder: true,
      items: {
        orderBy: { sortOrder: "asc" }
      }
    }
  });
}
