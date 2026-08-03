import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { attachPOStats } from "@/features/po/services/po-stats";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileText,
  PackageOpen,
  type LucideIcon,
} from "lucide-react";

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
    <div className="brand-page dashboard-page">
      <header className="brand-page-header">
        <div>
          <p className="brand-eyebrow">Ruang kerja operasional</p>
          <h1>Dashboard</h1>
          <p>
          Ringkasan aktivitas Sistem Surat Jalan Digital
          </p>
        </div>
        <Link className="brand-primary-button" href="/po?upload=true">
          <PackageOpen aria-hidden="true" size={17} />
          Upload Excel Baru
        </Link>
      </header>

      <div className="dashboard-metrics">
        <MetricCard
          title="Total Purchase Order"
          value={totalPO.toString()}
          icon={PackageOpen}
          note="Data PO tersimpan"
        />
        <MetricCard
          title="Total Surat Jalan"
          value={totalSJ.toString()}
          icon={FileText}
          note="Dokumen keseluruhan"
        />
        <MetricCard
          title="Sudah Dicetak"
          value={printedSJ.toString()}
          icon={CheckCircle2}
          note={`${progressPercentage}% dari seluruh dokumen`}
        />
        <MetricCard
          title="Belum Dicetak"
          value={notPrintedSJ.toString()}
          icon={Clock3}
          note="Perlu ditindaklanjuti"
        />
      </div>

      <section className="brand-card dashboard-progress-card">
        <div>
          <div>
            <p className="brand-eyebrow">Status dokumen</p>
            <h2>Progres Pencetakan Keseluruhan</h2>
            <p>{printedSJ} dari {totalSJ} surat jalan telah selesai dicetak.</p>
          </div>
          <strong>{progressPercentage}%</strong>
        </div>
        <div
          aria-label={`${progressPercentage}% surat jalan sudah dicetak`}
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={progressPercentage}
          className="brand-progress"
          role="progressbar"
        >
          <span style={{ width: `${progressPercentage}%` }} />
        </div>
      </section>

      <div className="dashboard-list-grid">
        <section className="brand-card dashboard-list-card">
          <div className="brand-section-heading">
            <div>
              <h2>PO Terbaru</h2>
              <p>Pembaruan Purchase Order terakhir.</p>
            </div>
            <Link href="/po" className="brand-inline-link">
              Lihat Semua <ArrowRight aria-hidden="true" size={15} />
            </Link>
          </div>
          <div className="dashboard-list">
            {recentPOsWithStats.length > 0 ? (
              recentPOsWithStats.map((po) => (
                <article key={po.id}>
                  <div className="dashboard-list-main">
                    <span className="list-icon"><PackageOpen aria-hidden="true" size={17} /></span>
                    <div>
                    <Link href={`/po/${po.id}`}>
                      {po.poNumber}
                    </Link>
                    <p>{po.companyName}</p>
                    </div>
                  </div>
                  <div className="dashboard-list-meta">
                    <strong>
                      {po.stats.printedPercentage}% Selesai
                    </strong>
                    <span>
                      {po.stats.printedCount} / {po.stats.totalCount} SJ
                    </span>
                  </div>
                </article>
              ))
            ) : (
              <div className="dashboard-compact-empty">
                <PackageOpen aria-hidden="true" size={21} />
                <span>Belum ada data Purchase Order.</span>
              </div>
            )}
          </div>
        </section>

        <section className="brand-card dashboard-list-card">
          <div className="brand-section-heading">
            <div>
              <h2>Perlu Diselesaikan</h2>
              <p>PO dengan surat jalan yang belum dicetak.</p>
            </div>
            <span className="list-icon"><Clock3 aria-hidden="true" size={17} /></span>
          </div>
          <div className="dashboard-list">
            {pendingPOsWithStats.length > 0 ? (
              pendingPOsWithStats.map((po) => (
                <article key={po.id}>
                  <div className="dashboard-list-main">
                    <span className="list-icon"><FileText aria-hidden="true" size={17} /></span>
                    <div>
                    <Link href={`/po/${po.id}`}>
                      {po.poNumber}
                    </Link>
                    <p>{po.companyName}</p>
                    </div>
                  </div>
                  <div className="dashboard-list-meta">
                    <span className="brand-status brand-status-warning">
                      {po.stats.status}
                    </span>
                    <span>
                      {po.stats.notPrintedCount} Belum Dicetak
                    </span>
                  </div>
                </article>
              ))
            ) : (
              <div className="dashboard-compact-empty">
                <CheckCircle2 aria-hidden="true" size={21} />
                <span>Semua surat jalan telah dicetak.</span>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon,
  note,
}: {
  title: string;
  value: string;
  icon: LucideIcon;
  note: string;
}) {
  const Icon = icon;
  return (
    <article className="brand-card metric-card">
      <div className="metric-icon-tile">
        <Icon aria-hidden="true" size={21} strokeWidth={1.8} />
      </div>
      <div>
        <p>{title}</p>
        <strong>{value}</strong>
        <span>{note}</span>
      </div>
    </article>
  );
}
