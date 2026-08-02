import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { attachPOStats } from "@/features/po/services/po-stats";

export const metadata: Metadata = {
  title: "Dashboard - Sistem Surat Jalan",
};

export default async function DashboardPage() {
  // Aggregate Metrics
  const [totalPO, totalSJ, printedSJ] = await Promise.all([
    prisma.purchaseOrder.count(),
    prisma.deliveryNote.count(),
    prisma.deliveryNote.count({ where: { printStatus: "PRINTED" } }),
  ]);

  const progressPercentage = totalSJ > 0 ? Math.round((printedSJ / totalSJ) * 100) : 0;
  const notPrintedSJ = totalSJ - printedSJ;

  // Recent Purchase Orders
  const recentPOs = await prisma.purchaseOrder.findMany({
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    take: 5,
    include: {
      _count: {
        select: { deliveryNotes: true },
      },
    },
  });

  const recentPOsWithStats = await attachPOStats(recentPOs);

  // POs needing completion (has NOT_PRINTED notes)
  const pendingPOs = await prisma.purchaseOrder.findMany({
    where: {
      deliveryNotes: {
        some: { printStatus: "NOT_PRINTED" },
      },
    },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    take: 5,
    include: {
      _count: {
        select: { deliveryNotes: { where: { printStatus: "NOT_PRINTED" } } },
      },
    },
  });

  const pendingPOsWithStats = await attachPOStats(pendingPOs);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Ringkasan aktivitas Sistem Surat Jalan Digital
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Purchase Order"
          value={totalPO.toString()}
          icon="📦"
          color="bg-blue-50 text-blue-700"
        />
        <MetricCard
          title="Total Surat Jalan"
          value={totalSJ.toString()}
          icon="📄"
          color="bg-purple-50 text-purple-700"
        />
        <MetricCard
          title="Surat Jalan Tercetak"
          value={printedSJ.toString()}
          icon="🖨️"
          color="bg-green-50 text-green-700"
        />
        <MetricCard
          title="Belum Dicetak"
          value={notPrintedSJ.toString()}
          icon="🕒"
          color="bg-orange-50 text-orange-700"
        />
      </div>

      <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-2 flex items-center justify-between gap-4 text-sm">
          <h2 className="font-semibold text-gray-900">Progress Keseluruhan</h2>
          <span className="font-semibold text-blue-700">{progressPercentage}%</span>
        </div>
        <div
          aria-label={`${progressPercentage}% surat jalan sudah dicetak`}
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={progressPercentage}
          className="h-3 overflow-hidden rounded-full bg-gray-200"
          role="progressbar"
        >
          <div
            className="h-full rounded-full bg-blue-600"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </section>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent POs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-100 px-6 py-4 flex justify-between items-center bg-gray-50/50">
            <h2 className="text-base font-semibold text-gray-900">PO Terbaru</h2>
            <Link href="/po" className="text-sm font-medium text-blue-600 hover:text-blue-700">
              Lihat Semua &rarr;
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {recentPOsWithStats.length > 0 ? (
              recentPOsWithStats.map((po) => (
                <div key={po.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div>
                    <Link href={`/po/${po.id}`} className="font-medium text-blue-600 hover:underline">
                      {po.poNumber}
                    </Link>
                    <p className="text-sm text-gray-500 mt-0.5">{po.companyName}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {po.stats.printedPercentage}% Selesai
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {po.stats.printedCount} / {po.stats.totalCount} SJ
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-8 text-center text-sm text-gray-500">
                Belum ada data Purchase Order.
              </div>
            )}
          </div>
        </div>

        {/* Pending POs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-100 px-6 py-4 bg-gray-50/50">
            <h2 className="text-base font-semibold text-gray-900">Perlu Diselesaikan</h2>
            <p className="text-sm text-gray-500">PO dengan surat jalan belum dicetak</p>
          </div>
          <div className="divide-y divide-gray-100">
            {pendingPOsWithStats.length > 0 ? (
              pendingPOsWithStats.map((po) => (
                <div key={po.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div>
                    <Link href={`/po/${po.id}`} className="font-medium text-blue-600 hover:underline">
                      {po.poNumber}
                    </Link>
                    <p className="text-sm text-gray-500 mt-0.5">{po.companyName}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full inline-block">
                      {po.stats.status}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {po.stats.notPrintedCount} Belum Dicetak
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-8 text-center text-sm text-gray-500">
                Semua surat jalan telah dicetak. Bagus sekali!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string;
  icon: string;
  color: string;
}) {
  return (
    <div className="bg-white overflow-hidden rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
      <div className={`p-3 rounded-lg ${color} text-2xl`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
        <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  );
}
