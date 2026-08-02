"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateDeliveryNoteAction } from "../actions";
import { DeliveryNoteEditInput } from "../schemas";

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


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

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

    submitForm(dataToSubmit);
  };


  const submitForm = (dataToSubmit: DeliveryNoteEditInput) => {
    startTransition(async () => {
      const result = await updateDeliveryNoteAction(dataToSubmit);
      if (result.error) {
        setError(result.error);
      } else {
        router.push(`/surat-jalan/${dataToSubmit.id}`);
        // router.refresh() removed in favor of revalidatePath on server
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="workspace-card" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {error && (
        <div className="empty-state" style={{ padding: "1rem", backgroundColor: "#fee2e2", color: "#991b1b" }}>
          {error}
        </div>
      )}

      <div>
        <h2 style={{ marginBottom: "1rem" }}>Informasi Surat</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div className="field-group">
            <label>Nomor Surat Jalan</label>
            <input type="text" value={formData.documentNumber || ""} onChange={e => handleChange("documentNumber", e.target.value)} />
          </div>
          <div className="field-group">
            <label>Tanggal</label>
            <input type="date" value={formData.documentDate || ""} onChange={e => handleChange("documentDate", e.target.value)} />
          </div>
          <div className="field-group">
            <label>Nomor PO <span style={{ color: "red" }}>*</span></label>
            <input type="text" readOnly value={formData.poNumber} />
            <p className="field-help">Nomor PO diubah melalui halaman Edit PO agar seluruh surat jalan tetap konsisten.</p>
          </div>
        </div>
      </div>

      <div>
        <h2 style={{ marginBottom: "1rem" }}>Informasi Penerima</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div className="field-group">
            <label>Perusahaan Penerima <span style={{ color: "red" }}>*</span></label>
            <input type="text" required value={formData.recipientCompanyName} onChange={e => handleChange("recipientCompanyName", e.target.value)} />
          </div>
          <div className="field-group">
            <label>Nama Cabang <span style={{ color: "red" }}>*</span></label>
            <input type="text" required value={formData.branchName} onChange={e => handleChange("branchName", e.target.value)} />
          </div>
          <div className="field-group">
            <label>Nama Penerima</label>
            <input type="text" value={formData.recipientName || ""} onChange={e => handleChange("recipientName", e.target.value)} />
          </div>
        </div>
      </div>

      <div>
        <h2 style={{ marginBottom: "1rem" }}>Informasi Pengiriman (Opsional)</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div className="field-group">
            <label>Kendaraan</label>
            <input type="text" value={formData.vehicleName || ""} onChange={e => handleChange("vehicleName", e.target.value)} />
          </div>
          <div className="field-group">
            <label>Nomor Kendaraan</label>
            <input type="text" value={formData.vehicleNumber || ""} onChange={e => handleChange("vehicleNumber", e.target.value)} />
          </div>
          <div className="field-group">
            <label>Nomor PO Tambahan</label>
            <input type="text" value={formData.additionalPoNumber || ""} onChange={e => handleChange("additionalPoNumber", e.target.value)} />
          </div>
        </div>
      </div>

      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h2>Daftar Barang</h2>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button type="button" className="secondary-button" onClick={handleUppercaseAll}>Jadikan Semua Kapital</button>
            <button type="button" className="primary-button" onClick={handleAddItem}>+ Tambah Barang</button>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: "80px" }}>Urutan</th>
                <th style={{ width: "100px" }}>Kuantitas <span style={{ color: "red" }}>*</span></th>
                <th style={{ width: "100px" }}>Satuan</th>
                <th>Nama Barang <span style={{ color: "red" }}>*</span></th>
                <th>Keterangan</th>
                <th style={{ width: "150px" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {formData.items.map((item, index) => (
                <tr key={item.id || `new-${index}`}>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <button type="button" disabled={index === 0} onClick={() => moveItem(index, "up")}>▲</button>
                      <button type="button" disabled={index === formData.items.length - 1} onClick={() => moveItem(index, "down")}>▼</button>
                    </div>
                  </td>
                  <td>
                    <input type="number" step="0.001" required value={item.quantity} onChange={e => handleItemChange(index, "quantity", e.target.value)} style={{ width: "100%", padding: "8px", border: "1px solid #d6d9df", borderRadius: "6px" }} />
                  </td>
                  <td>
                    <input type="text" value={item.unit || ""} onChange={e => handleItemChange(index, "unit", e.target.value)} style={{ width: "100%", padding: "8px", border: "1px solid #d6d9df", borderRadius: "6px" }} />
                  </td>
                  <td>
                    <input type="text" required value={item.displayProductName} onChange={e => handleItemChange(index, "displayProductName", e.target.value)} style={{ width: "100%", padding: "8px", border: "1px solid #d6d9df", borderRadius: "6px", marginBottom: "4px" }} />
                    <div style={{ display: "flex", gap: "4px" }}>
                      <button type="button" className="secondary-button" style={{ padding: "2px 4px", fontSize: "10px" }} onClick={() => handleUppercase(index)}>Kapital</button>
                    </div>
                  </td>
                  <td>
                    <input type="text" value={item.description || ""} onChange={e => handleItemChange(index, "description", e.target.value)} style={{ width: "100%", padding: "8px", border: "1px solid #d6d9df", borderRadius: "6px" }} />
                  </td>
                  <td>
                    <button type="button" className="secondary-button" style={{ color: "red", borderColor: "red" }} onClick={() => handleRemoveItem(index)}>Hapus</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>


      <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "1rem" }}>

        <button type="button" className="secondary-button" onClick={() => router.back()} disabled={isPending}>
          Batal
        </button>
        <button type="submit" className="primary-button" disabled={isPending}>
          {isPending ? "Menyimpan..." : "Simpan Perubahan"}
        </button>
      </div>
    </form>
  );
}
