# Product Requirements Document (PRD)
## Revisi Phase 3 - Workspace Data PO, Login, dan Dashboard
> **Visi revisi:** User masuk melalui Login, memahami kondisi pekerjaan melalui Dashboard, lalu mengelola seluruh siklus data dari satu workspace utama bernama **Data PO**: upload Excel, melihat semua PO, membuka satu PO, mencari surat jalan di dalam PO, mengedit data, memantau progres cetak, dan menghapus PO yang sudah tidak diperlukan.
## Informasi Dokumen
| Atribut | Nilai |
| --- | --- |
| Judul | PRD Revisi Phase 3 - Workspace Data PO, Login, dan Dashboard |
| Versi | 1.1 (Addendum terhadap PRD Baseline v1.0) |
| Tanggal | 31 Juli 2026 |
| Status | Siap diberikan kepada Antigravity untuk implementasi dan audit |
| Pemilik produk | CV. Pramudya Putra |
| Platform | Aplikasi web internal, desktop-first dan tablet-friendly |
| Branch target | `phase/03-revision-po-workspace-auth` |
| Dokumen induk | `docs/PRD-Sistem-Surat-Jalan.md` |

> **Kedudukan dokumen:** Dokumen ini adalah addendum yang memperbarui struktur navigasi, autentikasi, dashboard, manajemen Purchase Order, dan ruang lingkup Phase 3. Ketika terdapat konflik dengan PRD v1.0, ketentuan dalam dokumen ini menjadi sumber kebenaran untuk fitur yang dibahas di sini.

## Daftar Isi
- 1. Ringkasan Keputusan Produk
- 2. Masalah yang Diselesaikan
- 3. Tujuan Revisi
- 4. Sasaran Pengguna dan Hak Akses
- 5. Arsitektur Informasi dan Route
- 6. Alur Pengguna Utama
- 7. Halaman Login
- 8. Dashboard
- 9. Workspace Data PO
- 10. Detail Satu PO
- 11. Edit Data PO
- 12. Hapus Data PO
- 13. Integrasi Surat Jalan dan Batas Phase Cetak
- 14. Navigasi dan Visual Design
- 15. Aturan Bisnis
- 16. Kebutuhan Data dan Teknis
- 17. Kebutuhan Fungsional Terukur
- 18. Non-Functional Requirements
- 19. Keamanan
- 20. Error, Empty State, dan Feedback
- 21. Kompatibilitas dengan Phase 2 dan Phase 3 Existing
- 22. Strategi Pengujian dan UAT
- 23. Acceptance Criteria
- 24. Di Luar Scope Revisi Phase 3
- 25. Roadmap Setelah Revisi
- 26. Risiko dan Mitigasi
- 27. Urutan Implementasi yang Disarankan
- Lampiran A. Flow Ringkas
- Lampiran B. Istilah Produk

## 1. Ringkasan Keputusan Produk
- Aplikasi memiliki halaman awal **Login**, kemudian mengarahkan user ke **Dashboard**.
- Halaman kerja utama bernama **Data PO** dan berada pada route `/po`.
- Upload Excel tidak lagi menjadi menu utama terpisah; komponen upload digabung ke bagian atas halaman Data PO.
- Bagian bawah halaman Data PO menampilkan seluruh Purchase Order yang berhasil di-import ke sistem.
- Satu baris/kartu pada daftar mewakili satu PO, bukan satu file. Satu file yang mengandung beberapa PO dapat menghasilkan beberapa entri PO.
- Klik salah satu PO membuka halaman khusus `/po/[poId]`, yang hanya menampilkan data surat jalan dari PO tersebut.
- Di halaman detail PO, user dapat mencari cabang/kode surat jalan, memfilter status, membuka surat jalan, mengedit identitas PO, melihat progres cetak, dan menghapus PO melalui konfirmasi ketat.
- Fitur cetak dan PDF final tetap dikerjakan di Phase 5. Revisi Phase 3 hanya menyiapkan alur dan titik integrasinya tanpa tombol palsu yang seolah sudah berfungsi.
- Route lama dipertahankan untuk kompatibilitas, tetapi tidak menjadi pusat navigasi user.

> **Keputusan UX:** Flow operasional dibuat sederhana, tetapi tampilan tidak boleh terasa kosong. Kekayaan tampilan berasal dari ringkasan statistik, progress bar, metadata, search/filter, tabel yang rapi, feedback upload, loading state, breadcrumb, dan layout dashboard profesional - bukan dari menambah menu yang tidak perlu.

## 2. Masalah yang Diselesaikan
- Upload dan pencarian surat jalan sebelumnya tersebar di halaman berbeda, sehingga flow user kurang alami.
- User belum mempunyai tampilan yang menunjukkan seluruh PO yang pernah di-import dan progres pencetakannya.
- User belum dapat membuka satu PO sebagai konteks kerja khusus, sehingga pencarian global dapat mencampurkan data antar-PO.
- Belum tersedia penghapusan satu PO yang tidak diperlukan lagi melalui konfirmasi ketat.
- Aplikasi belum memiliki login, proteksi route, dashboard operasional, dan navigasi yang terasa seperti produk internal profesional.
- Edit data PO berisiko mengubah data PO lain apabila informasi perusahaan disimpan sebagai master global tanpa scope yang jelas.

## 3. Tujuan Revisi
- Menyediakan satu workspace utama untuk upload dan pengelolaan semua PO.
- Memberikan visibilitas instan terhadap total PO, total surat jalan, jumlah sudah dicetak, dan jumlah belum dicetak.
- Membatasi pencarian pada PO yang sedang dibuka agar hasil lebih akurat dan mudah dipahami.
- Memungkinkan koreksi identitas PO secara aman dan konsisten untuk seluruh surat jalan di dalam PO tersebut.
- Memungkinkan penghapusan satu PO secara aman dengan persetujuan eksplisit dan konfirmasi nomor PO lengkap.
- Melindungi seluruh halaman dan mutation melalui autentikasi server-side.
- Menjaga parser Excel, re-import, status, editor surat jalan, dan fixture Phase 2/3 existing tetap berfungsi.

## 4. Sasaran Pengguna dan Hak Akses
| Pengguna | Kebutuhan Utama | Hak MVP |
| --- | --- | --- |
| Admin/Operator internal | Login, upload, melihat dashboard, mengelola PO dan surat jalan | Akses penuh terhadap semua fitur internal |
| Pengelola teknis | Menjalankan aplikasi, database, migration, backup, dan deployment | Akses lingkungan/deployment; bukan role UI terpisah pada MVP |

- MVP menggunakan satu role aplikasi: `ADMIN`.
- Tidak ada registrasi publik, login sosial, multi-tenant, atau manajemen role kompleks.
- Arsitektur user/session harus tetap memungkinkan penambahan role operator di masa depan tanpa merombak seluruh aplikasi.

## 5. Arsitektur Informasi dan Route
| Route | Fungsi |
| --- | --- |
| `/` | Redirect berdasarkan session: belum login ke `/login`, sudah login ke `/dashboard` |
| `/login` | Form login internal |
| `/dashboard` | Ringkasan operasional dan akses cepat |
| `/po` | Workspace utama: upload Excel + daftar seluruh PO |
| `/po/[poId]` | Ringkasan dan daftar surat jalan khusus satu PO |
| `/po/[poId]/edit` | Edit identitas PO secara global dan aman |
| `/surat-jalan/[id]` | Detail surat jalan existing |
| `/surat-jalan/[id]/edit` | Editor surat jalan existing |
| `/upload` | Redirect kompatibilitas ke `/po?upload=true` |
| `/surat-jalan` | Tetap dapat diakses sebagai indeks global/compatibility route, tetapi tidak menjadi menu utama |

Sidebar utama setelah login:
```text
Dashboard
Data PO

[Bagian bawah]
Nama user
Logout
```

## 6. Alur Pengguna Utama
1. User membuka aplikasi dan masuk melalui `/login`.
2. Setelah login berhasil, user diarahkan ke `/dashboard`.
3. User memilih menu **Data PO**.
4. Pada bagian atas halaman Data PO, user memilih atau menarik file Excel.
5. Sistem menjalankan validasi dan preview import existing, lalu user mengonfirmasi penyimpanan.
6. PO yang berhasil disimpan langsung muncul pada daftar PO di halaman yang sama.
7. Apabila terdapat dua PO, user memilih salah satunya dengan klik **Buka PO**.
8. Sistem membuka `/po/[poId]` dan hanya menampilkan surat jalan milik PO tersebut.
9. User mencari cabang atau kode surat jalan di dalam PO.
10. User membuka surat jalan untuk melihat atau mengedit data.
11. Pada Phase 5, action cetak dan PDF ditambahkan pada alur yang sama.
12. User dapat menghapus PO melalui konfirmasi ketat; PO yang masih memiliki surat jalan belum dicetak menampilkan peringatan tambahan.

```text
Login
  -> Dashboard
      -> Data PO
          -> Upload Excel
          -> PO muncul dalam daftar
          -> Buka PO
              -> Cari cabang/surat jalan dalam PO
              -> Buka atau edit surat jalan
              -> (Phase 5) Preview / Print / PDF
              -> Hapus PO melalui konfirmasi ketat
```

## 7. Halaman Login
- Terdiri dari identitas aplikasi/perusahaan dan card form login yang profesional.
- Field: email atau username, password, tampilkan/sembunyikan password, tombol Masuk.
- Login gagal menampilkan pesan Bahasa Indonesia tanpa mengungkap apakah email atau password yang salah.
- Session disimpan menggunakan cookie server-side yang `HttpOnly`, `SameSite`, dan `Secure` pada production.
- Password wajib disimpan dalam bentuk hash yang aman; dilarang menyimpan plaintext.
- Semua halaman internal, server action, dan route handler sensitif harus memverifikasi session, bukan hanya menyembunyikan menu di client.
- Logout mengakhiri session dan mengarahkan kembali ke `/login`.
- Tidak ada registrasi publik atau lupa password pada revisi ini.

> **Bootstrap admin:** Sediakan mekanisme satu kali untuk membuat admin lokal/production melalui script atau command aman. Credential aktual tidak boleh berada di source code, migration, seed publik, atau output log permanen.

## 8. Dashboard
Dashboard berfungsi sebagai pusat informasi operasional, bukan halaman dekoratif.
| Komponen | Isi |
| --- | --- |
| KPI 1 | Total PO aktif |
| KPI 2 | Total surat jalan |
| KPI 3 | Sudah Dicetak |
| KPI 4 | Belum Dicetak |
| Progress keseluruhan | Persentase surat jalan berstatus Sudah Dicetak |
| PO perlu perhatian | PO dengan jumlah Belum Dicetak terbesar atau progres belum selesai |
| PO terbaru | PO terakhir di-import/diubah, maksimal 5-10 entri |
| Quick action | Buka Data PO dan fokus ke area Upload Excel |

- Semua statistik harus berasal dari database dan dihitung dengan aggregate query yang efisien.
- Tidak boleh melakukan satu query per PO (N+1).
- Jika belum ada data, tampilkan empty state dan tombol menuju upload.
- Dashboard tidak memerlukan chart kompleks atau library visualisasi berat pada MVP.

## 9. Workspace Data PO
### 9.1 Area Upload Excel
- Area upload berada di bagian atas `/po` sebagai card yang jelas dan dapat dibuat collapsible setelah proses selesai.
- Mendukung `.xls` dan `.xlsx` sesuai parser Phase 2 existing.
- Gunakan ulang logic, validasi, preview, transaksi, hash, dan deduplikasi existing. Dilarang membuat parser baru yang berbeda hanya untuk halaman ini.
- Setelah import sukses, tampilkan ringkasan jumlah PO, cabang/surat jalan, item, warning, dan error.
- Daftar PO di bawahnya diperbarui melalui targeted refresh/revalidation tanpa reload seluruh aplikasi yang tidak perlu.
- Error import harus tetap menunjukkan file/sheet/baris/kolom jika informasi tersedia.

### 9.2 Daftar Semua PO
| Kolom/Elemen | Keterangan |
| --- | --- |
| Nomor PO | Nomor PO lengkap dan dapat dibungkus dengan rapi |
| Perusahaan | Kode dan nama perusahaan pada PO |
| Sumber | Nama file upload atau metadata sumber bila tersedia |
| Total surat jalan | Jumlah cabang/surat jalan dalam PO |
| Sudah Dicetak | Jumlah status `PRINTED` |
| Belum Dicetak | Jumlah status `NOT_PRINTED` |
| Progress | Persentase dan progress bar |
| Status PO | Belum Dimulai, Sedang Diproses, atau Selesai - dihitung, bukan enum wajib |
| Diperbarui | Tanggal update/import terakhir |
| Aksi | Buka PO |

- Search universal: nomor PO, kode perusahaan, nama perusahaan, periode, dan nama file sumber bila relasinya tersedia.
- Filter status: Semua, Belum Dimulai, Sedang Diproses, Selesai.
- Sort default: terakhir di-update atau di-import paling baru.
- Server-side pagination; default 20 dan batas maksimum 100.
- Search/filter/page disimpan pada URL: `q`, `status`, `page`, dan `limit`.
- Pada desktop gunakan tabel informatif; pada layar sempit gunakan horizontal scroll yang terkontrol atau card responsive, bukan mengecilkan font secara ekstrem.

## 10. Detail Satu PO
Route `/po/[poId]` adalah workspace khusus satu PO dan tidak boleh menampilkan data PO lain.
| Bagian | Isi |
| --- | --- |
| Breadcrumb | Dashboard / Data PO / Nomor PO |
| Header | Nomor PO, kode/nama perusahaan, periode/sumber, tanggal update |
| Aksi | Edit Data PO dan Hapus Data PO |
| KPI | Total surat jalan, Sudah Dicetak, Belum Dicetak, Total item |
| Progress | Progress bar dan persentase cetak PO |
| Search internal | Cabang, kode unik, nomor surat jalan, data penerima yang relevan |
| Filter | Semua, Belum Dicetak, Sudah Dicetak |
| Tabel surat jalan | Cabang, kode unik, jumlah item, status, terakhir dicetak, aksi Buka/Edit |
| Pagination | Server-side dan tersimpan di URL |

- Query wajib memiliki kondisi `purchaseOrderId = poId` selain search/filter.
- Klik surat jalan membuka route existing dan menyediakan breadcrumb/link kembali ke PO induk.
- Tidak boleh ada tombol Print aktif yang belum benar-benar berfungsi. Ruang action harus siap menerima Print pada Phase 5.
- PO yang tidak ditemukan atau tidak boleh diakses mengembalikan not-found/unauthorized yang aman.

## 11. Edit Data PO
- Field minimum: nomor PO, kode perusahaan, nama perusahaan tampil, dan periode/keterangan PO jika model mendukung.
- Perubahan bersifat untuk PO yang sedang dibuka dan seluruh surat jalan di dalam PO tersebut.
- Edit perusahaan pada PO tidak boleh diam-diam mengubah PO lain yang memakai master perusahaan yang sama.
- Jika schema existing menggunakan entity `Company` bersama, gunakan snapshot/override pada level PO atau solusi scoped lain yang menjamin PO lain tidak berubah.
- Nomor PO wajib unik sesuai aturan database yang sudah disepakati; duplikasi ditolak dengan pesan Bahasa Indonesia.
- Sebelum menyimpan perubahan yang berdampak ke seluruh surat jalan, tampilkan konfirmasi yang menyebut jumlah surat jalan terdampak.
- Jika nilai tidak berubah, jangan melakukan update database, jangan reset status, dan jangan memperbarui `updatedAt` tanpa alasan.
- Jika data yang dirender pada dokumen berubah, semua surat jalan terkait yang berstatus `PRINTED` kembali menjadi `NOT_PRINTED`.
- `firstPrintedAt`, `lastPrintedAt`, dan `printCount` tetap dipertahankan sesuai aturan audit print existing.
- Gunakan transaction dan optimistic concurrency menggunakan `updatedAt` atau version field.

> **Batas aman:** Edit satu surat jalan tetap hanya mengubah surat jalan tersebut. Edit melalui halaman PO adalah satu-satunya flow yang boleh menerapkan perubahan global ke seluruh surat jalan dalam PO itu.

## 12. Hapus Data PO
### 12.1 Kelayakan Penghapusan
- PO dapat dihapus tanpa bergantung pada status cetak apabila admin menyelesaikan seluruh konfirmasi penghapusan.
- Jika masih ada `NOT_PRINTED`, modal wajib menampilkan jumlah data yang belum dicetak dan memperingatkan bahwa data tersebut ikut terhapus permanen.
- Server wajib memverifikasi session admin, acknowledgment, nomor PO yang diketik persis, dan snapshot concurrency di dalam transaction.

### 12.2 Konfirmasi
- Modal menampilkan nomor PO, perusahaan, total surat jalan, total item, sudah dicetak, dan belum dicetak.
- User wajib mencentang persetujuan penghapusan permanen.
- User wajib mengetik nomor PO lengkap secara persis.
- Tombol hapus aktif hanya saat persetujuan dicentang dan teks cocok.
- Pesan menegaskan tindakan permanen dan tidak dapat dibatalkan.

### 12.3 Data yang Dihapus
- `DeliveryNoteItem` milik PO tersebut.
- `DeliveryNote` milik PO tersebut.
- `PurchaseOrder` yang dipilih.
- PO lain, surat jalan lain, migration, schema, Docker volume, dan file Excel repository tidak boleh terpengaruh.
- Record upload tidak otomatis dihapus karena satu upload dapat memuat lebih dari satu PO dan berguna untuk audit. Relasi harus dilepas/ditangani tanpa orphan atau foreign-key error.

### 12.4 Setelah Berhasil
- Redirect ke `/po` dengan toast sukses.
- Dashboard dan daftar PO direvalidasi secara tertarget.
- PO yang sudah dihapus tidak muncul pada search/detail dan direct URL menghasilkan not-found.

## 13. Integrasi Surat Jalan dan Batas Phase Cetak
- Detail dan editor surat jalan yang selesai pada Phase 3 existing dipertahankan.
- Navigasi utama menuju surat jalan berasal dari `/po/[poId]` agar user selalu bekerja dalam konteks PO.
- Detail surat jalan menampilkan breadcrumb/link kembali ke PO induk.
- Phase 4 membangun template surat jalan berbasis React/HTML/CSS menggunakan scan dan logo sebagai referensi.
- Phase 5 mengaktifkan preview final, Print, Download PDF, update status, dan direct-print action dari detail PO.
- Revisi Phase 3 tidak boleh membuat implementasi print/PDF setengah jadi atau mengubah status secara palsu.

## 14. Navigasi dan Visual Design
- Gunakan app shell profesional: sidebar desktop, header, breadcrumb, identitas user, dan logout.
- Sidebar hanya menampilkan Dashboard dan Data PO agar flow tetap fokus.
- Gunakan warna netral dengan aksen brand; hindari tampilan terlalu kosong maupun dekorasi berlebihan.
- Gunakan KPI card, progress bar, badge, metadata sekunder, table spacing yang cukup, dan empty state yang informatif.
- Sediakan loading skeleton pada dashboard, daftar PO, detail PO, dan proses upload.
- Gunakan toast/inline alert untuk hasil upload, edit, hapus, error, dan konflik concurrency.
- Form dan modal harus dapat digunakan dengan keyboard, memiliki focus state, label, dan pesan validasi yang terhubung.
- Desktop target 1440x900 dan tablet target 768x1024.
- Animasi hanya untuk transisi ringan; tidak boleh menghambat operasi data.

## 15. Aturan Bisnis
| ID | Aturan |
| --- | --- |
| BR-01 | Satu PO ditentukan oleh identitas PurchaseOrder existing dan dapat berisi banyak surat jalan/cabang. |
| BR-02 | Satu file upload dapat menghasilkan satu atau lebih PO; daftar Data PO selalu menampilkan per-PO. |
| BR-03 | Status PO dihitung: 0 printed = Belum Dimulai; sebagian = Sedang Diproses; seluruhnya = Selesai. |
| BR-04 | Search pada detail PO tidak boleh keluar dari scope PO aktif. |
| BR-05 | Perubahan identitas PO yang memengaruhi dokumen mereset surat jalan PRINTED dalam PO itu ke NOT_PRINTED. |
| BR-06 | Perubahan lokal surat jalan tidak mengubah PO atau surat jalan lain. |
| BR-07 | PO dapat dihapus setelah acknowledgment dan nomor PO lengkap diverifikasi di server, termasuk ketika masih ada surat jalan NOT_PRINTED. |
| BR-08 | Penghapusan PO bersifat hard delete pada data bisnis terkait dan atomik. |
| BR-09 | Re-import file identik tidak menggandakan PO/surat jalan/item. |
| BR-10 | Edit data PO tidak boleh mengubah PO lain melalui shared Company secara tidak sengaja. |
| BR-11 | Semua mutation memerlukan session admin valid. |
| BR-12 | Print/PDF tidak termasuk revisi Phase 3. |

## 16. Kebutuhan Data dan Teknis
- Pertahankan Next.js App Router, TypeScript, PostgreSQL, Prisma, Zod, dan parser Excel existing.
- Audit schema existing sebelum menambah migration. Migration diperbolehkan hanya jika diperlukan untuk User/Session atau snapshot PO yang aman.
- Tidak boleh menjalankan `prisma migrate reset`, `docker compose down -v`, `DROP DATABASE`, atau penghapusan volume.
- Aggregate dashboard/PO harus dilakukan di database dengan `count`, `groupBy`, conditional aggregate, atau query setara yang efisien.
- Hindari N+1 dan jangan mengambil seluruh item hanya untuk menghitung jumlah.
- Mutation edit/hapus menggunakan transaction, server validation, authorization, dan optimistic concurrency.
- Gunakan targeted `revalidatePath`/cache invalidation hanya pada route yang relevan.
- Prisma Client harus singleton/server-only sesuai pola project existing.
- Tanggal bisnis tidak boleh bergeser akibat timezone.
- Credential admin dan session secret tidak boleh tersimpan pada file tracked.

## 17. Kebutuhan Fungsional Terukur
| ID | Fitur | Kriteria ringkas |
| --- | --- | --- |
| AUTH-01 | Login admin | User valid masuk ke dashboard; user tidak valid ditolak. |
| AUTH-02 | Proteksi route dan mutation | Akses tanpa session ke route/action internal ditolak atau diarahkan ke login. |
| AUTH-03 | Logout | Session berakhir dan route internal tidak lagi dapat diakses. |
| DASH-01 | KPI dashboard | Total PO, surat jalan, PRINTED, NOT_PRINTED akurat. |
| DASH-02 | Progress keseluruhan | Persentase dihitung aman termasuk saat total 0. |
| DASH-03 | PO terbaru/perlu perhatian | Data berasal dari query efisien dan link membuka PO benar. |
| PO-01 | Upload terintegrasi | Upload/preview/import existing berfungsi dari `/po`. |
| PO-02 | Daftar PO | Setiap PO tampil satu kali dengan summary counts. |
| PO-03 | Search/filter/pagination | Query tersimpan di URL dan hasil akurat. |
| PO-04 | Refresh setelah import | PO baru muncul tanpa reload aplikasi yang tidak perlu. |
| POD-01 | Detail PO | Hanya surat jalan milik PO aktif yang tampil. |
| POD-02 | Search internal | Cabang/kode/nomor surat jalan dapat dicari dalam PO. |
| POD-03 | Ringkasan progres | Total, printed, unprinted, item, persentase akurat. |
| POE-01 | Edit PO | Nomor/kode/nama/periode dapat diubah secara scoped dan transactional. |
| POE-02 | Konfirmasi global | Jumlah surat jalan terdampak ditampilkan sebelum save. |
| POE-03 | Status reset | Hanya PO terkait yang di-reset ketika data dokumen berubah. |
| PODL-01 | Peringatan hapus belum selesai | PO dengan NOT_PRINTED menampilkan jumlah terdampak dan peringatan permanen sebelum konfirmasi. |
| PODL-02 | Konfirmasi ketik PO | Delete hanya aktif jika input sama persis. |
| PODL-03 | Delete atomik | Item, surat jalan, dan PO terkait terhapus; PO lain aman. |
| NAV-01 | App shell | Sidebar, header, breadcrumb, user, logout konsisten. |
| COMP-01 | Kompatibilitas route | `/upload` redirect dan route existing tidak rusak. |
| PERF-01 | Query efisien | Tidak ada N+1 pada dashboard, daftar PO, atau detail PO. |

## 18. Non-Functional Requirements
| Kategori | Target |
| --- | --- |
| Performa | Setelah dev server warm: navigasi/list/detail ideal <2 detik; mutation biasa ideal <2 detik dan maksimum 3 detik pada lokal normal. |
| Skalabilitas MVP | Ribuan surat jalan dan puluhan/ratusan PO tanpa memuat seluruh data sekaligus. |
| Reliability | Import/edit/delete atomik; tidak ada partial write. |
| Usability | User awam dapat mencapai upload, membuka PO, mencari cabang, dan kembali tanpa memahami struktur data. |
| Accessibility | Keyboard dasar, label form, focus state, contrast wajar, modal fokus terkelola. |
| Observability | Error server dicatat tanpa credential; UI menerima pesan yang aman. |
| Maintainability | Upload component reusable; business logic di service/server layer; query tidak tersebar tanpa pola. |

## 19. Keamanan
- Password hash menggunakan algoritma/library keamanan yang mapan; dilarang membuat algoritma crypto sendiri.
- Session secret kuat dan tidak di-commit.
- Cookie `HttpOnly`, `SameSite`, dan `Secure` di production.
- Server action/route handler memanggil authorization guard.
- Input divalidasi Zod di server meskipun sudah divalidasi di client.
- Pesan error login tidak mengungkap keberadaan akun.
- Delete memerlukan re-authentication tidak wajib pada MVP, tetapi membutuhkan session valid, typed confirmation, dan server recheck.
- Tidak ada credential pada screenshot, final report, Git diff, atau seed tracked.

## 20. Error, Empty State, dan Feedback
| Kondisi | Respons UI |
| --- | --- |
| Belum ada PO | Empty state dengan penjelasan dan fokus ke upload. |
| Upload berhasil | Summary jumlah PO/surat jalan/item + toast sukses. |
| Upload sebagian warning | Warning terstruktur tanpa menyembunyikan data yang valid. |
| Duplikasi file/data | Pesan bahwa data sudah ada atau tidak menghasilkan duplikasi. |
| PO tidak ditemukan | Not found dengan link kembali ke Data PO. |
| Search tidak menemukan hasil | Empty result yang mempertahankan konteks PO/filter. |
| Conflict concurrency | Pesan bahwa data telah berubah dan harus dimuat ulang. |
| Hapus berisiko | Tampilkan jumlah sudah/belum dicetak dan minta acknowledgment serta nomor PO persis. |
| Hapus gagal | Data rollback dan pesan aman; tidak ada partial delete. |
| Session berakhir | Redirect login dan tidak menjalankan mutation. |

## 21. Kompatibilitas dengan Phase 2 dan Phase 3 Existing
- Parser adaptif, normalisasi, file hash, deduplikasi, transaction import, dan fixture sample tidak boleh diregresikan.
- Daftar/detail/editor surat jalan existing tetap berfungsi.
- Upload UI existing direfaktor menjadi komponen reusable, bukan disalin sehingga ada dua implementasi berbeda.
- Route `/upload` menjadi redirect kompatibilitas; bookmark lama tidak menghasilkan 404.
- Route `/surat-jalan` tetap tersedia minimal sampai seluruh flow baru stabil.
- Semua test Phase 2 dan Phase 3 existing wajib tetap lulus.
- Fixture wajib tetap: 92 surat jalan, 462 item, Cianjur tepat 3 item.

## 22. Strategi Pengujian dan UAT
### 22.1 Automated Tests
- Authentication: login valid/invalid, protected route, protected action, logout, expired session.
- Dashboard aggregate: data kosong, data campuran, persentase, urutan recent/attention.
- Daftar PO: search, status computed, pagination, sort, counts, tanpa N+1 bila dapat diobservasi pada service layer.
- Detail PO: scoping wajib, search/filter/pagination, direct access PO lain tidak bocor.
- Edit PO: duplicate, no-op, scoped company changes, global confirmation semantics, reset status, concurrency.
- Delete PO: blocked jika ada NOT_PRINTED, typed mismatch, server recheck, atomic delete, rollback, PO lain aman, upload audit aman.
- Regression: import sample, duplicate import, editor surat jalan, search/filter existing.

### 22.2 Browser UAT
1. Buka aplikasi tanpa session dan pastikan diarahkan ke login.
2. Login dengan admin lokal dan pastikan dashboard tampil.
3. Periksa KPI ketika database kosong.
4. Buka Data PO dan upload sample Excel melalui panel baru.
5. Verifikasi PO muncul dengan 92 surat jalan dan 462 item.
6. Buka PO sample dan cari Cianjur.
7. Verifikasi Cianjur memiliki 3 item expected melalui detail surat jalan.
8. Edit metadata PO yang aman pada fixture disposable, simpan, refresh, dan verifikasi scope.
9. Periksa dialog delete pada PO belum selesai: harus diblokir.
10. Uji delete pada PO disposable yang seluruh surat jalannya PRINTED; PO lain harus tetap ada.
11. Uji desktop 1440x900 dan tablet 768x1024.
12. Periksa console/browser/server log untuk error kritis.

## 23. Acceptance Criteria
- Unauthenticated user tidak dapat mengakses halaman atau mutation internal.
- Login dan logout bekerja dengan session aman; tidak ada plaintext password di repository.
- Dashboard menampilkan aggregate akurat dan dapat mengarahkan user ke PO.
- `/po` menggabungkan upload Excel dan daftar semua PO dalam satu halaman.
- Import existing tetap menghasilkan sample 92 surat jalan dan 462 item.
- PO baru muncul pada daftar setelah import.
- Search/filter/pagination daftar PO berfungsi dan tersimpan di URL.
- Klik PO membuka halaman khusus yang tidak membocorkan data PO lain.
- Detail PO menampilkan total, printed, unprinted, item, dan progress yang akurat.
- Pencarian Cianjur di PO sample berhasil dan detailnya tetap berisi tiga item expected.
- Edit PO bersifat scoped, transactional, mempunyai konfirmasi, validation, dan concurrency protection.
- Perubahan identitas PO tidak mengubah PO lain secara tidak sengaja.
- Delete PO yang masih memiliki surat jalan belum dicetak hanya berjalan setelah acknowledgment dan nomor PO persis tervalidasi.
- Delete valid menghapus hanya item/surat jalan/PO target secara atomik.
- Route `/upload` tetap bekerja melalui redirect dan route existing tidak rusak.
- Tidak ada implementasi print/PDF setengah jadi pada Phase 3.
- Lint, build, test, verify sample, dan Prisma validate lulus.
- Tidak ada commit, push, merge, atau PR sebelum review user.

## 24. Di Luar Scope Revisi Phase 3
- Template surat jalan final berbasis code dan aset logo/scan (Phase 4).
- Preview A4 final, Print, Download PDF, dan status print dari action nyata (Phase 5).
- Multi-role kompleks, permission matrix, registrasi, lupa password, MFA, SSO.
- Dashboard analytics kompleks, chart berat, laporan keuangan, atau export dashboard.
- Soft delete, recycle bin, restore PO, dan retention policy otomatis.
- Backup/restore melalui UI dan disaster recovery production (Phase 6).
- Notifikasi WhatsApp/email dan integrasi sistem eksternal.

## 25. Roadmap Setelah Revisi
| Phase | Scope |
| --- | --- |
| Phase 3 Revisi | Login, app shell, Dashboard, Data PO terintegrasi, detail/edit/hapus PO, integrasi flow surat jalan, audit dan UAT. |
| Phase 4 | Template surat jalan React/HTML/CSS menggunakan desain scan dan logo sebagai referensi. |
| Phase 5 | Preview final, Print, PDF, status cetak, direct-print dari detail PO. |
| Phase 6 | Hardening, backup, observability, security review, UAT final, production readiness. |

## 26. Risiko dan Mitigasi
| Risiko | Dampak | Mitigasi |
| --- | --- | --- |
| Scope Phase 3 membesar | Durasi dan regression meningkat | Implementasi bertahap, baseline test, no commit hingga UAT. |
| Shared Company mengubah PO lain | Data historis salah | PO-level snapshot/override atau scoped update eksplisit. |
| Aggregate query lambat | Dashboard/list lambat | Group/count database, index, pagination, audit N+1. |
| Delete salah target | Kehilangan data | Server recheck, typed confirmation, transaction, test isolation. |
| Auth hanya di client | Mutation bisa diakses tanpa izin | Authorization server-side pada semua action/handler. |
| Upload logic terduplikasi | Perilaku berbeda dan bug | Refactor komponen, satu service/import pipeline. |
| Status belum PRINTED sebelum Phase 5 | Delete belum dapat diuji pada sample utama | Automated test dan fixture disposable khusus UAT; jangan memanipulasi sample utama. |

## 27. Urutan Implementasi yang Disarankan
1. Audit repository, branch, schema, routes, test, dan performa baseline.
2. Buat branch revisi tanpa kehilangan perubahan Phase 3 existing.
3. Tambahkan kebutuhan data/auth dan migration minimal yang aman.
4. Implementasikan authorization guard, login, logout, dan bootstrap admin.
5. Bangun app shell, sidebar, header, dan breadcrumb.
6. Bangun dashboard aggregate.
7. Refactor upload existing menjadi komponen reusable dan integrasikan ke `/po`.
8. Bangun daftar semua PO beserta search/filter/pagination/progress.
9. Bangun detail PO beserta scoping dan navigasi surat jalan.
10. Bangun edit PO dengan konfirmasi, transaction, no-op detection, dan concurrency.
11. Bangun delete PO dengan eligibility, typed confirmation, transaction, dan server recheck.
12. Tambahkan redirect kompatibilitas dan integrasi breadcrumb pada route existing.
13. Jalankan automated tests, browser UAT, performa, responsive, dan accessibility audit.
14. Berikan laporan tanpa commit atau push.

## Lampiran A. Flow Ringkas
```text
A. Upload dan pengelolaan
Login -> Dashboard -> Data PO -> Upload Excel -> Preview -> Simpan
-> PO muncul -> Buka PO -> Cari cabang -> Buka/Edit Surat Jalan

B. Penyelesaian PO
Detail PO -> Periksa Sudah/Belum Dicetak -> seluruhnya PRINTED
-> Hapus Data PO -> ketik nomor PO -> transaksi delete -> kembali Data PO

C. Batas phase
Phase 3 Revisi: data dan workspace
Phase 4: template dokumen
Phase 5: preview/print/PDF/status aktual
Phase 6: hardening/backup/production
```

## Lampiran B. Istilah Produk
| Istilah | Definisi |
| --- | --- |
| Data PO | Workspace utama yang menggabungkan upload Excel dan daftar Purchase Order aktif. |
| PO | Purchase Order yang menjadi induk banyak surat jalan/cabang. |
| Surat Jalan | Dokumen per cabang di dalam satu PO. |
| Sudah Dicetak | Status `PRINTED` pada surat jalan. |
| Belum Dicetak | Status `NOT_PRINTED` pada surat jalan. |
| Belum Dimulai | Status ringkasan PO ketika printedCount = 0. |
| Sedang Diproses | Status ringkasan PO ketika 0 < printedCount < total. |
| Selesai | Status ringkasan PO ketika printedCount = total dan total > 0. |
| Import | Proses membaca Excel, memvalidasi, dan menyimpan struktur data ke database. |
| Upload | Tindakan memilih/mengirim file ke aplikasi; tidak selalu berarti import sudah disimpan. |
