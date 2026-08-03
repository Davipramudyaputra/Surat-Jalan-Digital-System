# PRD Design UI — Sistem Surat Jalan Digital

**Perusahaan:** CV. Pramudya Putra  
**Project:** Sistem Surat Jalan Digital  
**Dokumen:** Product Requirements Document — UI/UX Design  
**Versi:** 1.0  
**Status:** Siap digunakan sebagai acuan Codex  
**Branch implementasi:** `phase/04-delivery-note-printing`  
**Referensi visual:** `CV_Pramudya_Putra_Company_Profile_Katalog_Final 2.pdf`  
**Dokumen pendamping:** `docs/PRD-Phase-4-Template-Preview-Cetak-Surat-Jalan.md`

---

# 1. Ringkasan

PRD ini mendefinisikan arah desain UI Sistem Surat Jalan Digital agar selaras dengan identitas visual katalog CV. Pramudya Putra.

Desain aplikasi harus terasa:

- profesional;
- administratif;
- modern;
- bersih;
- mudah dipindai;
- kuat secara identitas brand;
- tetap efisien untuk pekerjaan operasional harian.

Referensi katalog tidak boleh ditempel sebagai background aplikasi. Elemen visual katalog harus diterjemahkan menjadi:

- design tokens;
- typography hierarchy;
- card system;
- icon system;
- navigation;
- forms;
- tables;
- status badges;
- empty states;
- dialogs;
- preview Surat Jalan;
- print controls;
- responsive behaviour.

Business logic existing tidak boleh diubah hanya demi penyesuaian visual.

---

# 2. Tujuan

1. Menyatukan tampilan seluruh aplikasi dengan identitas CV. Pramudya Putra.
2. Menjadikan UI lebih profesional tanpa mengurangi efisiensi operasional.
3. Membuat informasi PO dan Surat Jalan lebih mudah dipindai.
4. Menyediakan design system reusable.
5. Menyempurnakan UI Phase 4 untuk preview dan print.
6. Menjamin tampilan desktop, tablet, dan mobile tetap dapat digunakan.
7. Menjaga accessibility.
8. Mencegah desain berubah menjadi katalog promosi yang berlebihan.
9. Mengurangi hard-coded style.
10. Menjaga seluruh fitur Phase 3 dan Phase 4 tetap bekerja.

---

# 3. Sumber Referensi Visual

## 3.1 Sampul Katalog

Karakter visual:

- background putih;
- logo merah dan hitam;
- judul serif besar;
- kombinasi kata merah dan hitam;
- garis merah pendek;
- bentuk diagonal merah pada sudut;
- bidang abu-abu lembut;
- ilustrasi produk di bagian bawah;
- footer kontak.

Terjemahan ke aplikasi:

- heading besar dapat menggunakan serif;
- keyword tertentu boleh memakai warna merah;
- garis merah pendek dipakai sebagai section accent;
- diagonal merah hanya sebagai decorative corner;
- white space tetap dominan.

## 3.2 Halaman Tentang Kami

Karakter visual:

- komposisi dua kolom;
- body text di kiri;
- information card di kanan;
- icon merah;
- divider;
- border tipis;
- background putih dan abu-abu lembut.

Terjemahan ke aplikasi:

- summary panel;
- detail card;
- form groups;
- profile/status panel;
- split content layout desktop.

## 3.3 Visi, Misi, dan Nilai

Karakter visual:

- section icon merah;
- quote card;
- numbered list;
- value cards;
- red accent line;
- card shadow sangat lembut.

Terjemahan ke aplikasi:

- step cards;
- statistic cards;
- numbered workflow;
- warning/confirmation card;
- dashboard highlight.

## 3.4 Layanan Utama dan Keunggulan

Karakter visual:

- card grid;
- nomor besar berwarna merah;
- icon outline;
- title tegas;
- body text;
- gambar pendukung;
- border dan radius lembut.

Terjemahan ke aplikasi:

- dashboard cards;
- quick actions;
- feature cards;
- empty states;
- action summaries.

## 3.5 Katalog Produk

Karakter visual:

- modular cards;
- hierarchy jelas;
- kategori;
- title merah atau hitam;
- detail spesifikasi;
- icon metadata;
- grid responsif.

Terjemahan ke aplikasi:

- list/table alternatives;
- PO cards pada mobile;
- summary panel;
- detail data;
- item cards bila table tidak ideal.

## 3.6 Cara Pemesanan

Karakter visual:

- numbered vertical workflow;
- icon circular;
- connector line;
- title merah;
- contact information;
- CTA.

Terjemahan ke aplikasi:

- progress stepper;
- upload/import workflow;
- print workflow;
- confirmation sequence;
- processing progress.

---

# 4. Prinsip Desain

## 4.1 Data First

Data bisnis harus lebih dominan daripada dekorasi.

Prioritas visual:

1. status;
2. nomor PO;
3. perusahaan;
4. cabang;
5. progress cetak;
6. action;
7. metadata;
8. dekorasi.

## 4.2 Minimal Branded

Brand harus terasa melalui:

- merah;
- serif display heading;
- garis pendek;
- icon outline;
- diagonal corner;
- cards;
- spacing.

Brand tidak boleh diterapkan melalui:

- background merah penuh;
- pola besar di belakang table;
- gambar katalog sebagai wallpaper;
- efek glow;
- gradient berlebihan;
- animasi promosi.

## 4.3 Consistent

Semua screen menggunakan:

- spacing yang sama;
- radius yang sama;
- button variants yang sama;
- typography hierarchy yang sama;
- table styles yang sama;
- badge system yang sama;
- dialog pattern yang sama.

## 4.4 Accessible

UI wajib:

- memiliki kontras cukup;
- memiliki visible focus;
- dapat digunakan keyboard;
- tidak bergantung pada warna saja;
- memiliki label;
- memiliki error yang terbaca;
- memiliki touch target memadai.

## 4.5 Responsive

App shell boleh berubah mengikuti viewport.

Dokumen Surat Jalan tidak boleh reflow menjadi mobile card. Preview menggunakan scale atau scroll.

---

# 5. Design Tokens

## 5.1 Brand Colors

Nilai berikut merupakan baseline yang diturunkan secara visual dari katalog. Final token boleh disesuaikan setelah dibandingkan dengan logo high-resolution.

```css
:root {
  --brand-red-800: #9F0C11;
  --brand-red-700: #B90F15;
  --brand-red-600: #D2151B;
  --brand-red-500: #E31B23;
  --brand-red-100: #FCE8E9;
  --brand-red-50:  #FFF5F5;

  --ink-950: #18181B;
  --ink-900: #242428;
  --ink-800: #35363A;
  --ink-700: #4E5157;
  --ink-500: #767A82;

  --surface-white: #FFFFFF;
  --surface-soft: #FAFAFA;
  --surface-muted: #F4F5F6;
  --surface-strong: #ECEEF0;

  --border-soft: #E1E3E6;
  --border-medium: #CCD0D5;

  --success-700: #147A48;
  --success-100: #E7F6ED;

  --warning-700: #A86000;
  --warning-100: #FFF3D6;

  --danger-700: #B91C23;
  --danger-100: #FCE8E9;

  --info-700: #205D9C;
  --info-100: #E9F2FB;
}
```

Aturan:

- primary action memakai merah;
- active navigation memakai merah muda dan indicator merah;
- text utama tidak memakai pure black;
- background utama tetap putih;
- abu-abu dipakai untuk separation;
- warna status harus memiliki icon atau label.

## 5.2 Typography

Metadata font asli tidak dapat dipastikan hanya dari render PDF. Gunakan alternatif web yang paling mendekati karakter katalog.

```text
Display heading:
- Playfair Display
- Cormorant Garamond
- fallback: Georgia, Times New Roman, serif

UI/body:
- Inter
- Plus Jakarta Sans
- fallback: Arial, sans-serif
```

Aturan:

- serif hanya untuk page heading dan hero heading;
- table, input, button, badge, metadata, dan body memakai sans-serif;
- judul tidak seluruhnya uppercase kecuali label pendek.

Typography scale:

```text
Display XL : 44 px / 52 px / 700
Display L  : 36 px / 44 px / 700
Page title : 30 px / 38 px / 700
Section    : 22 px / 30 px / 700
Card title : 17 px / 24 px / 700
Body L     : 16 px / 26 px / 400
Body       : 14 px / 22 px / 400
Table      : 13-14 px
Caption    : 12 px / 18 px
Button     : 14 px / 20 px / 600
```

## 5.3 Spacing

Gunakan sistem 4 px:

```text
4, 8, 12, 16, 20, 24, 32, 40, 48, 64
```

Page padding:

```text
Desktop large : 32-40 px
Laptop        : 24-32 px
Tablet        : 20-24 px
Mobile        : 16 px
```

## 5.4 Radius

```text
Control kecil : 8 px
Input/button  : 10 px
Card          : 14 px
Large panel   : 18 px
Dialog        : 18 px
```

## 5.5 Shadow

```css
--shadow-card: 0 8px 22px rgba(24, 24, 27, 0.06);
--shadow-panel: 0 14px 34px rgba(24, 24, 27, 0.08);
--shadow-dialog: 0 24px 64px rgba(24, 24, 27, 0.18);
--shadow-preview: 0 18px 52px rgba(24, 24, 27, 0.14);
```

Shadow tidak boleh terasa seperti glow.

## 5.6 Border

```text
Default : 1 px solid border-soft
Strong  : 1 px solid border-medium
Accent  : 2-3 px brand red
```

---

# 6. Brand Decoration Components

Buat reusable components:

```text
BrandCorner
SectionAccentLine
SubtleDotPattern
SubtleWavePattern
NumberBadge
RedIconTile
BrandSectionHeader
```

Aturan:

- maksimal satu decorative corner dominan per screen;
- dotted pattern hanya pada empty area;
- wave pattern opacity rendah;
- dekorasi tidak berada di belakang text penting;
- semua dekorasi disembunyikan atau dikurangi pada mobile;
- dekorasi tidak ikut print.

---

# 7. App Shell

## 7.1 Desktop Sidebar

Width:

```text
Expanded : 248-264 px
Collapsed: 76-84 px
```

Isi:

- logo;
- section navigation;
- active state;
- user block;
- logout.

Menu existing atau relevan:

```text
Dashboard
Data PO
Surat Jalan
Riwayat Cetak
Pengaturan
Keluar
```

Jangan membuat route/menu baru jika fungsi belum tersedia.

Active menu:

- background `brand-red-50`;
- text `brand-red-700`;
- icon merah;
- left indicator 3 px;
- radius 10 px.

## 7.2 Header

Height:

```text
64-72 px
```

Isi:

- mobile menu button;
- breadcrumb atau page title;
- contextual action;
- user profile.

Background:

- putih;
- border-bottom;
- tidak gradient;
- sticky bila membantu.

## 7.3 Content Background

- `surface-soft`;
- white content cards;
- optional wave pattern sangat halus;
- tidak menggunakan gambar katalog.

## 7.4 Mobile Navigation

- sidebar menjadi drawer;
- logo tetap terlihat;
- menu height minimal 44 px;
- drawer dapat ditutup Escape dan overlay click;
- focus trap.

---

# 8. Core Components

# 8.1 Buttons

## Primary

- merah;
- text putih;
- icon opsional;
- hover lebih gelap;
- loading;
- disabled.

## Secondary

- putih;
- border;
- text gelap;
- hover abu-abu.

## Ghost

- tanpa border;
- untuk toolbar.

## Destructive

- merah tua;
- hanya delete/permanent action.

Minimum:

```text
Desktop height: 40 px
Mobile height : 44 px
```

Action penting menggunakan icon dan label, bukan icon saja.

# 8.2 Input

- label terlihat;
- helper text;
- error text;
- focus ring merah;
- placeholder bukan pengganti label;
- height 42-44 px;
- required state.

# 8.3 Select

- konsisten dengan input;
- option label jelas;
- custom paper size memiliki unit mm;
- tidak memotong label.

# 8.4 Cards

Variants:

```text
StatCard
SummaryCard
ActionCard
InfoCard
WarningCard
AuditCard
EmptyStateCard
```

Karakter:

- border;
- radius;
- shadow lembut;
- icon merah;
- angka besar;
- garis accent pendek.

# 8.5 Table

Header:

- background muted;
- text tegas;
- sticky jika panjang.

Rows:

- hover lembut;
- divider;
- selected state;
- no excessive zebra.

Action:

- icon button + tooltip;
- action utama juga tersedia dalam text pada mobile.

Responsive:

- horizontal scroll;
- minimum column widths;
- mobile card view hanya untuk table aplikasi;
- table pada dokumen Surat Jalan tidak berubah menjadi card.

# 8.6 Badge

Variants:

```text
Belum Dicetak
Sudah Dicetak
Belum Dimulai
Dalam Proses
Selesai
Kosong
Gagal
```

Badge memiliki:

- icon/dot;
- label;
- background;
- text;
- aria-label.

# 8.7 Dialog

- heading;
- concise description;
- optional summary;
- primary and secondary action;
- focus trap;
- Escape;
- loading;
- prevent double submit.

# 8.8 Toast

- success;
- warning;
- error;
- info;
- icon + label;
- tidak menggantikan form error.

# 8.9 Tooltip

- untuk icon-only action;
- muncul keyboard focus;
- delay pendek;
- tidak menutupi action utama.

---

# 9. Screen Specifications

# 9.1 Login

## Desktop

Layout split:

```text
Left brand panel 45%
Right form panel 55%
```

Left:

- logo;
- heading serif;
- short value statement;
- diagonal red corner;
- subtle grey geometry;
- optional printing illustration only if asset exists.

Right:

- login card;
- email;
- password;
- show password;
- submit;
- error state.

Copy:

```text
Selamat Datang
Masuk ke Sistem Surat Jalan Digital
Kelola PO dan Surat Jalan secara lebih cepat dan akurat.
```

Mobile:

- single column;
- brand panel simplified;
- no large illustration;
- form becomes focus.

# 9.2 Dashboard

Header:

```text
Dashboard
Ringkasan operasional Surat Jalan
```

Cards:

1. Total PO
2. Total Surat Jalan
3. Belum Dicetak
4. Sudah Dicetak

Card style mengikuti modular card katalog:

- number;
- label;
- icon;
- red accent;
- helper.

Sections:

- PO terbaru;
- progress cetak;
- aktivitas terakhir;
- action cepat;
- warning data belum lengkap.

No fake charts.

# 9.3 Data PO

Header:

- title;
- subtitle;
- Upload Excel primary button;
- red accent line.

Toolbar:

- search;
- filter status;
- sort;
- result count;
- reset.

Table columns:

```text
Nomor PO
Perusahaan
Total Surat Jalan
Sudah Dicetak
Belum Dicetak
Progress
Status
Diperbarui
Aksi
```

Progress:

- red completed;
- grey remaining;
- percentage text.

Empty state:

- red document icon;
- title;
- explanation;
- Upload Excel action.

# 9.4 Upload Excel

Layout stepper based on “Cara Pemesanan” reference:

```text
1. Pilih File
2. Validasi
3. Preview
4. Import
```

Each step:

- numbered red circle;
- icon;
- title;
- status;
- connector line.

Upload area:

- drag and drop;
- select file;
- file type;
- size;
- sample link if existing.

Validation state:

- valid;
- warning;
- error;
- duplicate;
- re-import.

# 9.5 Detail PO

Top summary:

- PO number;
- company;
- created/updated;
- status;
- progress;
- Edit/Delete actions.

Statistic cards:

- total;
- printed;
- not printed;
- percentage.

Delivery Note list:

- branch search;
- filter;
- status;
- item count;
- last update;
- detail action;
- preview action.

Delete action:

- destructive button;
- confirmation;
- checkbox;
- exact PO number input.

# 9.6 Detail Surat Jalan

Header:

- branch;
- document number;
- PO;
- status badge.

Sections:

- document information;
- recipient;
- vehicle;
- items;
- print audit.

Actions:

```text
Edit Data
Lihat Preview
Kembali
```

Status warning if data edited after printing.

# 9.7 Edit Surat Jalan

Desktop:

```text
Form content: 8 columns
Summary panel: 4 columns
```

Groups:

1. Informasi Dokumen
2. Penerima dan Cabang
3. Kendaraan
4. Item
5. Audit

Item editor:

- quantity;
- unit;
- display name;
- description;
- reorder;
- add;
- delete.

Sticky action bar:

- Batal;
- Simpan;
- Simpan dan Preview if existing architecture allows.

Mobile:

- single column;
- sticky bottom action;
- item row becomes vertical edit card;
- preserve order.

# 9.8 Preview dan Print Surat Jalan

This is the primary Phase 4 screen.

Desktop layout:

```text
Top toolbar
Left/secondary paper settings panel
Center preview canvas
Right/secondary status and audit panel
```

For 1280 px:

- settings 280-320 px;
- preview flexible;
- audit may collapse.

For smaller viewports:

- settings drawer;
- audit accordion;
- preview full width.

## Toolbar

Actions:

```text
Kembali
Edit Data
Reset Setengah Folio
Cetak Surat Jalan
```

Context:

- active paper;
- orientation;
- page count;
- zoom.

## Paper Settings

Fields:

```text
Ukuran Kertas
Orientasi
Margin
Zoom Preview
Lebar Custom
Tinggi Custom
```

Profiles:

```text
Setengah Folio — default
A4
A5
B3 ISO
Custom
```

Default indicator:

```text
Format Utama
```

Use segmented control for orientation.

## Preview Canvas

- muted grey background;
- white document;
- centered;
- shadow;
- scale;
- scroll;
- profile dimensions;
- multiple pages stacked vertically;
- page gap 24-32 px;
- page number outside document only on screen.

Do not use scanned template as background.

## Audit Panel

Fields:

- status;
- first printed;
- last printed;
- print count;
- warning if edited after print.

## Guidance Box

```text
Gunakan ukuran kertas yang sama pada dialog printer.
Pilih Scale 100% / Actual Size.
Matikan Headers and Footers.
```

# 9.9 Print Confirmation Dialog

## Initial

Title:

```text
Periksa Data Surat Jalan
```

Summary:

- paper;
- orientation;
- pages;
- items.

Actions:

- Batal;
- Lanjutkan Cetak.

## Result

Title:

```text
Konfirmasi Hasil Cetak
```

Copy:

```text
Apakah Surat Jalan berhasil dicetak?
```

Actions:

- Belum / Batal;
- Ya, Tandai Sudah Dicetak.

# 9.10 Error and Empty Screens

Examples:

- PO tidak ditemukan;
- Surat Jalan tidak ditemukan;
- preview gagal;
- file tidak valid;
- session expired;
- no data;
- no search result.

Use:

- icon;
- title;
- one paragraph;
- retry/back action.

---

# 10. Responsive Matrix

| Viewport | App Shell | Cards | Table | Preview |
|---|---|---|---|---|
| >= 1440 | Full sidebar | 4 columns | Full | Settings + canvas + audit |
| 1280-1439 | Full/collapsible | 4 columns | Full | Settings + canvas |
| 1024-1279 | Collapsed sidebar | 2-4 columns | Scroll | Canvas + collapsible panels |
| 768-1023 | Drawer | 2 columns | Scroll | Settings drawer |
| < 768 | Mobile header | 1-2 columns | Card/scroll | Scaled/scroll canvas |

Rules:

- no page-level horizontal overflow;
- table wrapper may scroll;
- preview canvas may scroll;
- dialog nearly full screen on mobile;
- primary action remains visible;
- touch target >= 44 px.

---

# 11. Accessibility

Minimum requirements:

1. WCAG AA contrast.
2. Visible focus ring.
3. Keyboard support.
4. Semantic headings.
5. Form labels.
6. Error text linked to fields.
7. Icon button labels.
8. Dialog focus trap.
9. Escape closes non-destructive dialog.
10. Status not color-only.
11. Reduced motion.
12. Logo alt text.
13. Table semantic headers.
14. Screen reader labels for progress.
15. Disabled state is not communicated by opacity only.

---

# 12. Motion

Use subtle transitions:

```text
Hover         : 120-160 ms
Panel         : 180-220 ms
Dialog        : 180-240 ms
Toast         : 160-200 ms
```

Allowed:

- fade;
- subtle translate;
- scale 0.98 to 1 for dialog.

Not allowed:

- bounce;
- parallax;
- long animation;
- flashing;
- decorative looping motion.

---

# 13. Iconography

Use one icon library consistently.

Recommended:

```text
Lucide React
```

Style:

- outline;
- stroke 1.75-2 px;
- red for branded feature icons;
- neutral for utility icons;
- filled icon only for status when helpful.

Do not mix multiple unrelated icon libraries.

---

# 14. Copywriting

UI language:

- Indonesian;
- concise;
- professional;
- action-oriented;
- no unnecessary English except technical terms.

Examples:

```text
Upload Excel
Lihat Preview
Cetak Surat Jalan
Tandai Sudah Dicetak
Data telah berubah
Muat ulang preview
Belum Dicetak
Sudah Dicetak
```

Error messages must explain next action.

---

# 15. Implementation Rules for Codex

Before coding:

1. Read main Phase 4 PRD.
2. Read this UI PRD.
3. Audit existing components.
4. Audit existing Tailwind config.
5. Audit route structure.
6. Audit responsiveness.
7. Audit accessibility.
8. Compare with catalog reference.

Codex must:

- create centralized tokens;
- reuse components;
- avoid hard-coded colors;
- avoid duplicate components;
- preserve business logic;
- preserve Phase 3 behaviour;
- preserve print behaviour;
- test desktop/tablet/mobile;
- produce screenshots if browser tooling is available.

Codex must not:

- rebuild working features;
- use catalog pages as background;
- change schema for purely visual reasons;
- add fake data;
- add non-functional menu items;
- change expected sample;
- commit or push before approval.

---

# 16. Suggested File Structure

```text
src/
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Badge.tsx
│   │   ├── Card.tsx
│   │   ├── Dialog.tsx
│   │   ├── Toast.tsx
│   │   ├── Table.tsx
│   │   └── Tooltip.tsx
│   │
│   ├── brand/
│   │   ├── BrandCorner.tsx
│   │   ├── SectionAccentLine.tsx
│   │   ├── SubtleWavePattern.tsx
│   │   ├── SubtleDotPattern.tsx
│   │   └── RedIconTile.tsx
│   │
│   ├── layout/
│   │   ├── AppSidebar.tsx
│   │   ├── AppHeader.tsx
│   │   ├── MobileDrawer.tsx
│   │   └── PageContainer.tsx
│   │
│   └── delivery-note-template/
│
├── styles/
│   ├── tokens.css
│   ├── globals.css
│   └── print.css
```

Adapt to existing architecture rather than forcing a new one.

---

# 17. Acceptance Criteria

UI design is complete when:

1. The application visually aligns with the catalog.
2. Red, black, white, and grey are consistently applied.
3. Heading hierarchy reflects catalog style.
4. Serif is limited to display headings.
5. Body and operational UI remain sans-serif.
6. App shell is consistent.
7. Sidebar works in expanded/collapsed/drawer modes.
8. Dashboard is easy to scan.
9. PO table is readable.
10. Detail PO has clear hierarchy.
11. Edit form is organized.
12. Preview is the visual focus of Phase 4.
13. Paper settings are understandable.
14. Setengah Folio is clearly marked as default.
15. A4, A5, B3, and Custom are available.
16. Print dialogs match the design system.
17. Status and audit are easy to read.
18. Empty/error/loading states are implemented.
19. Responsive behaviour is verified.
20. Keyboard navigation works.
21. Focus states are visible.
22. Contrast meets WCAG AA.
23. No catalog image is used as application background.
24. No business logic is changed for visual reasons.
25. No Phase 3 regression.
26. No Phase 4 regression.
27. Lint passes.
28. Typecheck passes or is unavailable.
29. Build passes.
30. Tests pass.
31. No commit before approval.
32. No push before approval.

---

# 18. UAT Checklist

## Desktop

- Login aligned.
- Sidebar consistent.
- Dashboard cards aligned.
- Tables readable.
- Form groups clear.
- Preview controls clear.
- Dialogs centered.
- No clipping.
- No unexpected horizontal scroll.

## Tablet

- Drawer works.
- Cards reflow.
- Table scroll works.
- Preview controls accessible.
- Dialog fits.

## Mobile

- Header compact.
- Actions reachable.
- Form single-column.
- Table has usable fallback.
- Preview scales or scrolls.
- No document reflow.
- Modal near full screen.
- Touch targets adequate.

## Accessibility

- Tab order.
- Focus ring.
- Escape.
- Labels.
- Screen reader names.
- Status labels.
- Error associations.

---

# 19. Deliverables

1. UI PRD in Markdown.
2. Design tokens.
3. Typography setup.
4. App shell.
5. Reusable components.
6. Login redesign.
7. Dashboard redesign.
8. Data PO redesign.
9. Detail PO redesign.
10. Detail/Edit Surat Jalan redesign.
11. Preview/Print UI.
12. Responsive implementation.
13. Accessibility implementation.
14. Browser screenshots.
15. UAT report.
16. Final implementation report.

---

# 20. Definition of Done

The UI work is done when:

- main Phase 4 PRD is read;
- this UI PRD is read;
- the visual system is implemented consistently;
- catalog-inspired styling is visible without copying catalog pages as backgrounds;
- core screens are usable;
- Setengah Folio remains the default print format;
- alternate paper profiles remain clear;
- desktop, tablet, and mobile are verified;
- accessibility requirements are met;
- business logic remains intact;
- tests and build pass;
- result is ready for manual UAT;
- no commit or push is executed before user approval.
