"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateDeliveryNoteAction } from "../actions";
import { DeliveryNoteEditInput } from "../schemas";
import {
  CalendarClock,
  CaseUpper,
  ChevronDown,
  ChevronUp,
  Eye,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";

type Item = DeliveryNoteEditInput["items"][number];

export function DeliveryNoteForm({
  initialData,
}: {
  initialData: DeliveryNoteEditInput;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<DeliveryNoteEditInput>(initialData);

  const handleChange = (field: keyof DeliveryNoteEditInput, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (index: number, field: keyof Item, value: string | number | boolean) => {
    setFormData((prev) => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };
      return { ...prev, items: newItems };
    });
  };

  const handleAddItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          quantity: "1",
          unit: "",
          displayProductName: "",
          description: "",
          sortOrder: prev.items.length,
          isManuallyEdited: true,
        },
      ],
    }));
  };

  const handleRemoveItem = (index: number) => {
    if (formData.items.length <= 1) {
      alert("Minimal satu barang harus tersedia.");
      return;
    }
    if (!confirm(`Hapus barang "${formData.items[index].displayProductName}"?`)) return;

    setFormData((prev) => {
      const newItems = [...prev.items];
      newItems.splice(index, 1);
      // Re-adjust sort order
      newItems.forEach((item, i) => (item.sortOrder = i));
      return { ...prev, items: newItems };
    });
  };

  const moveItem = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === formData.items.length - 1) return;

    setFormData((prev) => {
      const newItems = [...prev.items];
      const swapIndex = direction === "up" ? index - 1 : index + 1;

      const temp = newItems[index];
      newItems[index] = newItems[swapIndex];
      newItems[swapIndex] = temp;

      // Update sortOrders
      newItems.forEach((item, i) => (item.sortOrder = i));
      return { ...prev, items: newItems };
    });
  };

  const handleUppercase = (index: number) => {
    handleItemChange(index, "displayProductName", formData.items[index].displayProductName.toUpperCase());
  };

  const handleUppercaseAll = () => {
    setFormData((prev) => {
      const newItems = prev.items.map((item) => ({
        ...item,
        displayProductName: item.displayProductName.toUpperCase(),
      }));
      return { ...prev, items: newItems };
    });
  };


  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const submitter = (e.nativeEvent as SubmitEvent)
      .submitter as HTMLButtonElement | null;
    const destination =
      submitter?.value === "preview" ? "preview" : "detail";

    // Validate 0 quantity before submitting
    const zeroQuantityItems = formData.items.filter(item => Number(item.quantity) === 0);
    let itemsToSubmit = formData.items;

    if (zeroQuantityItems.length > 0) {
      if (formData.items.length === zeroQuantityItems.length) {
        setError("Tidak dapat menyimpan surat jalan tanpa barang. Minimal satu barang harus memiliki kuantitas lebih dari 0.");
        return;
      }
      if (!confirm(`Terdapat ${zeroQuantityItems.length} barang dengan kuantitas 0. Barang-barang ini akan dihapus. Lanjutkan?`)) {
        return;
      }
      itemsToSubmit = formData.items.filter(item => Number(item.quantity) !== 0);
      itemsToSubmit.forEach((item, i) => (item.sortOrder = i));
      setFormData(prev => ({ ...prev, items: itemsToSubmit }));
    }

    const dataToSubmit = { ...formData, items: itemsToSubmit };

    submitForm(dataToSubmit, destination);
  };


  const submitForm = (
    dataToSubmit: DeliveryNoteEditInput,
    destination: "detail" | "preview",
  ) => {
    startTransition(async () => {
      const result = await updateDeliveryNoteAction(dataToSubmit);
      if (result.error) {
        setError(result.error);
      } else {
        router.push(
          destination === "preview"
            ? `/surat-jalan/${dataToSubmit.id}/preview`
            : `/surat-jalan/${dataToSubmit.id}`,
        );
        // router.refresh() removed in favor of revalidatePath on server
      }
    });
  };

  return (
    <form className="brand-card delivery-editor" onSubmit={handleSubmit}>
      {error ? (
        <div className="form-message form-message-error" role="alert">{error}</div>
      ) : null}

      <section className="editor-section" aria-labelledby="document-information-title">
        <div className="editor-section-heading">
          <span>01</span>
          <div><h2 id="document-information-title">Informasi Surat</h2><p>Identitas dokumen dan tanggal pengiriman.</p></div>
        </div>
        <div className="editor-grid">
          <div className="form-field">
            <label htmlFor="document-number">Nomor Surat Jalan</label>
            <input className="brand-input" id="document-number" type="text" value={formData.documentNumber || ""} onChange={e => handleChange("documentNumber", e.target.value)} />
          </div>
          <div className="form-field editor-date-field">
            <div className="field-label-row">
              <label htmlFor="document-date">Tanggal Surat Jalan</label>
              <span className={`brand-status ${formData.documentDate ? "brand-status-success" : "brand-status-neutral"}`}>
                {formData.documentDate ? "Tanggal pilihan" : "Realtime Indonesia"}
              </span>
            </div>
            <input
              aria-describedby="document-date-help"
              className="brand-input"
              id="document-date"
              type="date"
              value={formData.documentDate || ""}
              onChange={e => handleChange("documentDate", e.target.value)}
            />
            <p className="field-help" id="document-date-help">
              Jika diisi, tanggal ini digunakan pada preview dan hasil cetak. Kosongkan untuk memakai tanggal realtime Asia/Jakarta saat mencetak.
            </p>
            <button
              className="inline-neutral-action"
              disabled={!formData.documentDate || isPending}
              onClick={() => handleChange("documentDate", "")}
              type="button"
            >
              <CalendarClock aria-hidden="true" size={15} /> Gunakan Tanggal Realtime
            </button>
          </div>
          <div className="form-field">
            <label htmlFor="document-po">Nomor PO <span className="required-mark">*</span></label>
            <input className="brand-input" id="document-po" type="text" readOnly value={formData.poNumber} />
            <p className="field-help">Nomor PO diubah melalui halaman Edit PO agar seluruh surat jalan tetap konsisten.</p>
          </div>
        </div>
      </section>

      <section className="editor-section" aria-labelledby="recipient-information-title">
        <div className="editor-section-heading">
          <span>02</span>
          <div><h2 id="recipient-information-title">Informasi Penerima</h2><p>Tujuan perusahaan, cabang, dan penerima barang.</p></div>
        </div>
        <div className="editor-grid">
          <div className="form-field">
            <label htmlFor="recipient-company">Perusahaan Penerima <span className="required-mark">*</span></label>
            <input className="brand-input" id="recipient-company" type="text" required value={formData.recipientCompanyName} onChange={e => handleChange("recipientCompanyName", e.target.value)} />
          </div>
          <div className="form-field">
            <label htmlFor="recipient-branch">Nama Cabang <span className="required-mark">*</span></label>
            <input className="brand-input" id="recipient-branch" type="text" required value={formData.branchName} onChange={e => handleChange("branchName", e.target.value)} />
          </div>
          <div className="form-field">
            <label htmlFor="recipient-name">Nama Penerima</label>
            <input className="brand-input" id="recipient-name" type="text" value={formData.recipientName || ""} onChange={e => handleChange("recipientName", e.target.value)} />
          </div>
        </div>
      </section>

      <section className="editor-section" aria-labelledby="shipping-information-title">
        <div className="editor-section-heading">
          <span>03</span>
          <div><h2 id="shipping-information-title">Informasi Pengiriman</h2><p>Data kendaraan dan nomor PO tambahan bersifat opsional.</p></div>
        </div>
        <div className="editor-grid">
          <div className="form-field">
            <label htmlFor="vehicle-name">Kendaraan</label>
            <input className="brand-input" id="vehicle-name" type="text" value={formData.vehicleName || ""} onChange={e => handleChange("vehicleName", e.target.value)} />
          </div>
          <div className="form-field">
            <label htmlFor="vehicle-number">Nomor Kendaraan</label>
            <input className="brand-input" id="vehicle-number" type="text" value={formData.vehicleNumber || ""} onChange={e => handleChange("vehicleNumber", e.target.value)} />
          </div>
          <div className="form-field">
            <label htmlFor="additional-po">Nomor PO Tambahan</label>
            <input className="brand-input" id="additional-po" type="text" value={formData.additionalPoNumber || ""} onChange={e => handleChange("additionalPoNumber", e.target.value)} />
          </div>
        </div>
      </section>

      <section className="editor-section editor-items-section" aria-labelledby="items-title">
        <div className="editor-section-heading editor-items-heading">
          <span>04</span>
          <div><h2 id="items-title">Daftar Barang</h2><p>Atur isi dan urutan barang pada dokumen.</p></div>
          <div className="editor-heading-actions">
            <button type="button" className="brand-secondary-button" onClick={handleUppercaseAll}>
              <CaseUpper aria-hidden="true" size={16} /> Jadikan Semua Kapital
            </button>
            <button type="button" className="brand-primary-button" onClick={handleAddItem}>
              <Plus aria-hidden="true" size={16} /> Tambah Barang
            </button>
          </div>
        </div>

        <div className="brand-table-wrap">
          <table className="brand-table editor-table">
            <thead>
              <tr>
                <th scope="col">Urutan</th>
                <th scope="col">Kuantitas <span className="required-mark">*</span></th>
                <th scope="col">Satuan</th>
                <th scope="col">Nama Barang <span className="required-mark">*</span></th>
                <th scope="col">Keterangan</th>
                <th scope="col">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {formData.items.map((item, index) => (
                <tr key={item.id || `new-${index}`}>
                  <td>
                    <div className="reorder-actions">
                      <button aria-label={`Pindahkan barang ${index + 1} ke atas`} disabled={index === 0} onClick={() => moveItem(index, "up")} title="Pindahkan ke atas" type="button"><ChevronUp aria-hidden="true" size={16} /></button>
                      <button aria-label={`Pindahkan barang ${index + 1} ke bawah`} disabled={index === formData.items.length - 1} onClick={() => moveItem(index, "down")} title="Pindahkan ke bawah" type="button"><ChevronDown aria-hidden="true" size={16} /></button>
                    </div>
                  </td>
                  <td>
                    <input aria-label={`Kuantitas barang ${index + 1}`} className="editor-input" type="number" step="0.001" required value={item.quantity} onChange={e => handleItemChange(index, "quantity", e.target.value)} />
                  </td>
                  <td>
                    <input aria-label={`Satuan barang ${index + 1}`} className="editor-input" type="text" value={item.unit || ""} onChange={e => handleItemChange(index, "unit", e.target.value)} />
                  </td>
                  <td>
                    <input aria-label={`Nama barang ${index + 1}`} className="editor-input" type="text" required value={item.displayProductName} onChange={e => handleItemChange(index, "displayProductName", e.target.value)} />
                    <button className="uppercase-action" onClick={() => handleUppercase(index)} type="button"><CaseUpper aria-hidden="true" size={13} /> Kapital</button>
                  </td>
                  <td>
                    <input aria-label={`Keterangan barang ${index + 1}`} className="editor-input" type="text" value={item.description || ""} onChange={e => handleItemChange(index, "description", e.target.value)} />
                  </td>
                  <td>
                    <button aria-label={`Hapus barang ${index + 1}`} className="remove-item-action" onClick={() => handleRemoveItem(index)} title="Hapus barang" type="button"><Trash2 aria-hidden="true" size={16} /> Hapus</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="editor-action-bar">
        <button type="button" className="brand-secondary-button" onClick={() => router.back()} disabled={isPending}>
          <X aria-hidden="true" size={16} /> Batal
        </button>
        <button type="submit" className="brand-secondary-button" disabled={isPending} name="destination" value="detail">
          <Save aria-hidden="true" size={16} /> {isPending ? "Menyimpan..." : "Simpan Perubahan"}
        </button>
        <button type="submit" className="brand-primary-button" disabled={isPending} name="destination" value="preview">
          <Eye aria-hidden="true" size={16} /> {isPending ? "Menyimpan..." : "Simpan & Lihat Preview"}
        </button>
      </div>
    </form>
  );
}
