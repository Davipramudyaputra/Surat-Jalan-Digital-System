# Phase 6 — Output Naming Rules

## Format Filename

```
Surat-Jalan_<Nomor-PO>_<Cabang>.pdf
```

Contoh:

```
Surat-Jalan_678-PPU-SOF-CCM-VII-2026_Bandar-Jaya.pdf
```

## Karakter Terlarang

```
/ \ : * ? " < > |
```

Diganti dengan `-`.

## Sanitasi

- Trim whitespace.
- Ganti karakter terlarang dengan `-`.
- Normalisasi separator berulang (`---` → `-`).
- Ganti spasi dengan `-`.
- Hapus control character.
- Hapus titik/spasi di akhir segment.
- Hapus `-` di awal segment.

## Panjang Maksimum

- Total filename dibatasi 120 karakter (termasuk `.pdf`).

## Fallback

- Nomor PO kosong → segment `PO`.
- Cabang kosong → segment `Cabang`.

## Reserved Names

Nama reserved Windows (`CON`, `PRN`, `AUX`, `NUL`, `COM1..9`, `LPT1..9`)
ditangani agar tidak menjadi basename file valid.

## Contoh

| Input PO | Input Cabang | Output |
|---|---|---|
| `678/PPU SOF CCM/VII/2026` | `Bandar Jaya` | `Surat-Jalan_678-PPU-SOF-CCM-VII-2026_Bandar-Jaya.pdf` |
| `PO:1*?<>|\"` | `Cianjur/Utara` | `Surat-Jalan_PO-1_Cianjur-Utara.pdf` |
| (kosong) | `Cianjur` | `Surat-Jalan_PO_Cianjur.pdf` |
| `PO 1` | (kosong) | `Surat-Jalan_PO-1_Cabang.pdf` |

## Implementasi

- `src/features/pdf/lib/filename.ts`
- Test: `src/features/pdf/lib/filename.test.ts`
