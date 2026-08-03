import Image from "next/image";
import type { CSSProperties } from "react";

import { DELIVERY_NOTE_ROWS_PER_PAGE } from "@/lib/delivery-note-template/constants";
import { paginateDeliveryNoteItems } from "@/lib/delivery-note-template/pagination";
import {
  getPaperCssVariables,
  type PaperProfile,
} from "@/lib/delivery-note-template/paper-profiles";
import type {
  DeliveryNoteDocumentData,
  DeliveryNoteDocumentPage,
} from "@/lib/delivery-note-template/types";

import styles from "./delivery-note-template.module.css";
import { IndonesiaPrintDate } from "./IndonesiaPrintDate";

function DeliveryNoteContinuationHeader({
  data,
  page,
}: {
  data: DeliveryNoteDocumentData;
  page: DeliveryNoteDocumentPage;
}) {
  return (
    <header className={styles.continuationHeader}>
      <div className={styles.continuationBrand}>
        <strong>CV. PRAMUDYA PUTRA</strong>
        <span>PENGADAAN &amp; PERDAGANGAN UMUM</span>
      </div>
      <div className={styles.continuationIdentity}>
        <p>
          <span>Surat Jalan No.</span>
          <strong>{data.documentNumber}</strong>
        </p>
        <p>
          <span>PO</span>
          <strong>{data.poNumber}</strong>
        </p>
        <p className={styles.pageNumber}>
          Halaman {page.pageNumber} dari {page.totalPages}
        </p>
      </div>
    </header>
  );
}

function DeliveryNoteHeader({
  data,
  page,
}: {
  data: DeliveryNoteDocumentData;
  page: DeliveryNoteDocumentPage;
}) {
  return (
    <header className={styles.documentHeader}>
      <div className={styles.brandBlock}>
        <Image
          alt="Logo CV. Pramudya Putra"
          className={styles.brandLogo}
          height={724}
          priority
          src="/brand/logo-cv-pramudya-putra.png"
          unoptimized
          width={2172}
        />
      </div>

      <div className={styles.recipientBlock}>
        <p className={styles.documentDate}>
          <IndonesiaPrintDate documentDate={data.documentDate} />
        </p>
        <div className={styles.recipientLine}>
          <span>Kepada Yth:</span>
          <strong>{data.recipientCompanyName}</strong>
        </div>
        <div className={styles.recipientLine}>
          <span>Tuan/Toko:</span>
          <span aria-hidden="true" />
        </div>
        <div className={styles.branchLine}>
          <span>CABANG:</span>
          <strong>{data.branchName}</strong>
        </div>
        <div className={styles.recipientBlankLine} aria-hidden="true" />
        {page.totalPages > 1 ? (
          <p className={styles.pageNumber}>
            Halaman {page.pageNumber} dari {page.totalPages}
          </p>
        ) : null}
      </div>
    </header>
  );
}

function DeliveryNoteInformation({ data }: { data: DeliveryNoteDocumentData }) {
  return (
    <section className={styles.documentInformation}>
      <div className={styles.informationCopy}>
        <p className={styles.documentNumber}>
          <span>SURAT JALAN NO.</span>
          <strong>{data.documentNumber}</strong>
        </p>
        <p className={styles.deliverySentence}>
          Bersama ini kendaraan
          <span className={styles.inlineValue}>{data.vehicleName}</span>
          <span>no. kendaraan</span>
          <span className={styles.inlineValue}>{data.vehicleNumber}</span>
          <span>no. po.</span>
          <span className={styles.inlineValue}>{data.additionalPoNumber}</span>
        </p>
        <p className={styles.deliveryNotice}>
          Kami kirimkan barang-barang tersebut di bawah ini. Harap diterima
          dengan baik.
        </p>
      </div>
      <p className={styles.purchaseOrderNumber}>
        <span>Po. No:</span>
        <strong>{data.poNumber}</strong>
      </p>
    </section>
  );
}

function DeliveryNoteContinuationInformation({
  data,
}: {
  data: DeliveryNoteDocumentData;
}) {
  return (
    <section className={styles.continuationInformation}>
      <p>
        <span>Kepada Yth.</span>
        <strong>{data.recipientCompanyName}</strong>
      </p>
      <p>
        <span>Cabang</span>
        <strong>{data.branchName}</strong>
      </p>
    </section>
  );
}

function DeliveryNoteItemsTable({ page }: { page: DeliveryNoteDocumentPage }) {
  return (
    <table className={styles.itemsTable}>
      <colgroup>
        <col className={styles.quantityColumn} />
        <col className={styles.productColumn} />
        <col className={styles.descriptionColumn} />
      </colgroup>
      <thead>
        <tr>
          <th scope="col">BANYAKNYA</th>
          <th scope="col">NAMA BARANG</th>
          <th scope="col">KETERANGAN</th>
        </tr>
      </thead>
      <tbody>
        {page.rows.map((row, index) => (
          <tr
            key={row.item?.id ?? `empty-${page.pageNumber}-${index}`}
            style={{
              height: `${(89.75 / DELIVERY_NOTE_ROWS_PER_PAGE) * row.visualRowSpan}%`,
            }}
          >
            <td>{row.item?.quantity ?? ""}</td>
            <td>{row.item?.productName ?? ""}</td>
            <td>{row.item?.description ?? ""}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function DeliveryNoteFooter({ data }: { data: DeliveryNoteDocumentData }) {
  return (
    <footer className={styles.documentFooter}>
      <div className={styles.signatureBlock}>
        <p>Tanda Terima</p>
        <p className={styles.signatureName}>
          ({data.recipientName || "................................"})
        </p>
      </div>
      <p className={styles.receiptNote}>
        # Note: Setelah Barang Diterima Mohon Dicek #
      </p>
      <div className={styles.signatureBlock}>
        <p>Hormat Kami,</p>
        <p className={styles.signatureName}>(CV. PRAMUDYA PUTRA)</p>
      </div>
    </footer>
  );
}

function DeliveryNoteContinuationFooter({
  nextPage,
}: {
  nextPage: number;
}) {
  return (
    <footer className={styles.continuationFooter}>
      <p>Daftar barang berlanjut ke halaman {nextPage}.</p>
    </footer>
  );
}

export function DeliveryNoteDocument({
  data,
  paperProfile,
}: {
  data: DeliveryNoteDocumentData;
  paperProfile: PaperProfile;
}) {
  const pages = paginateDeliveryNoteItems(data.items);

  return (
    <div
      className={styles.documentPages}
      data-delivery-note-document
      data-paper-profile={paperProfile.id}
      style={getPaperCssVariables(paperProfile) as CSSProperties}
    >
      {pages.map((page) => {
        const isFirstPage = page.pageNumber === 1;
        const isLastPage = page.pageNumber === page.totalPages;

        return (
          <article
            className={styles.deliveryNotePage}
            data-page-number={page.pageNumber}
            key={page.pageNumber}
          >
            {isFirstPage ? (
              <DeliveryNoteHeader data={data} page={page} />
            ) : (
              <DeliveryNoteContinuationHeader data={data} page={page} />
            )}
            {isFirstPage ? (
              <DeliveryNoteInformation data={data} />
            ) : (
              <DeliveryNoteContinuationInformation data={data} />
            )}
            <DeliveryNoteItemsTable page={page} />
            {isLastPage ? (
              <DeliveryNoteFooter data={data} />
            ) : (
              <DeliveryNoteContinuationFooter
                nextPage={page.pageNumber + 1}
              />
            )}
          </article>
        );
      })}
    </div>
  );
}
