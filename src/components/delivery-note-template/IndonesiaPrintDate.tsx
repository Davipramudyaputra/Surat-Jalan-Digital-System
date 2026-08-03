"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  getBusinessDatePrintParts,
  getIndonesiaPrintDateParts,
  type IndonesiaPrintDateParts,
} from "@/lib/delivery-note-template/formatter";

import styles from "./delivery-note-template.module.css";

const FALLBACK_DATE: IndonesiaPrintDateParts = {
  dayMonth: "",
  century: "20",
  yearSuffix: "",
  label: "Bandung, ____________________",
};
const DATE_REFRESH_INTERVAL_MS = 30_000;

export function IndonesiaPrintDate({
  documentDate,
}: {
  documentDate?: string | null;
}) {
  const dayMonthRef = useRef<HTMLSpanElement>(null);
  const centuryRef = useRef<HTMLSpanElement>(null);
  const yearSuffixRef = useRef<HTMLSpanElement>(null);
  const selectedDateParts = useMemo(
    () => getBusinessDatePrintParts(documentDate ?? null),
    [documentDate],
  );
  const [dateParts, setDateParts] = useState(
    selectedDateParts ?? FALLBACK_DATE,
  );

  const updateDate = useCallback(() => {
    const nextParts =
      selectedDateParts ?? getIndonesiaPrintDateParts(new Date());

    // Perbarui DOM langsung agar event beforeprint selalu memakai tanggal
    // terbaru, termasuk ketika React belum sempat melakukan render berikutnya.
    if (dayMonthRef.current) {
      dayMonthRef.current.textContent = nextParts.dayMonth;
    }
    if (centuryRef.current) {
      centuryRef.current.textContent = nextParts.century;
    }
    if (yearSuffixRef.current) {
      yearSuffixRef.current.textContent = nextParts.yearSuffix;
    }
    setDateParts(nextParts);
  }, [selectedDateParts]);

  useEffect(() => {
    const initialUpdateId = window.setTimeout(updateDate, 0);

    const intervalId = window.setInterval(
      updateDate,
      DATE_REFRESH_INTERVAL_MS,
    );
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        updateDate();
      }
    };

    window.addEventListener("beforeprint", updateDate);
    window.addEventListener("focus", updateDate);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearTimeout(initialUpdateId);
      window.clearInterval(intervalId);
      window.removeEventListener("beforeprint", updateDate);
      window.removeEventListener("focus", updateDate);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [updateDate]);

  return (
    <span aria-label={dateParts.label} className={styles.printDateLayout}>
      <span aria-hidden="true" className={styles.printDateCity}>
        Bandung,
      </span>
      <span aria-hidden="true" className={styles.printDateField}>
        <span className={styles.printDateValue} ref={dayMonthRef}>
          {dateParts.dayMonth}
        </span>
      </span>
      <span aria-hidden="true" className={styles.printDateCentury}>
        <span ref={centuryRef}>{dateParts.century}</span>
      </span>
      <span aria-hidden="true" className={styles.printYearField}>
        <span className={styles.printDateValue} ref={yearSuffixRef}>
          {dateParts.yearSuffix}
        </span>
      </span>
    </span>
  );
}
