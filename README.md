# Sistem Surat Jalan

Sistem Surat Jalan adalah aplikasi web internal CV. Pramudya Putra untuk
mengubah data Purchase Order menjadi surat jalan yang mudah dicari, diperiksa,
dan dicetak.

Project saat ini berada pada **Phase 1 — Fondasi aplikasi dan database**.
Halaman dasar, koneksi PostgreSQL, Prisma, dan health check telah disiapkan.
Fitur upload dan pemrosesan Excel belum tersedia pada fase ini.

## Prasyarat

Pastikan perangkat telah memiliki:

- Node.js 22.12 atau lebih baru.
- npm.
- Docker Desktop atau Docker Engine dengan Docker Compose.
- Git untuk melakukan clone repository.

## Menyiapkan project

Clone repository dan masuk ke directory project:

```bash
git clone https://github.com/Davipramudyaputra/Surat-Jalan-Digital-System.git
cd Surat-Jalan-Digital-System
```

Salin file contoh environment:

```bash
cp .env.example .env
```

Buka `.env`, lalu ganti password contoh dengan password khusus local
development. Pastikan nilai `POSTGRES_DB`, `POSTGRES_USER`,
`POSTGRES_PASSWORD`, `POSTGRES_PORT`, dan `DATABASE_URL` tetap konsisten.

Nilai pada `.env.example` hanya contoh local development dan bukan rekomendasi
credential production.

Instal dependency:

```bash
npm install
```

## Menjalankan PostgreSQL

Jalankan database:

```bash
docker compose up -d
```

Periksa status container:

```bash
docker compose ps
```

Lihat log PostgreSQL jika diperlukan:

```bash
docker compose logs postgres
```

Data PostgreSQL disimpan pada named volume
`surat_jalan_postgres_data`, sehingga tetap tersedia ketika container
dihentikan.

> Jangan menjalankan `docker compose down -v` jika data local masih diperlukan.
> Opsi `-v` akan menghapus named volume beserta datanya.

## Menyiapkan Prisma

Validasi konfigurasi dan generate Prisma Client:

```bash
npx prisma validate
npx prisma generate
```

Schema Phase 1 sengaja belum memiliki model bisnis. Model Purchase Order,
Surat Jalan, dan item akan dibuat pada Phase 2.

## Menjalankan aplikasi

Jalankan development server:

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000). Route utama akan
mengarahkan browser ke halaman Surat Jalan.

Route yang tersedia:

- `/surat-jalan`
- `/upload`
- `/api/health`

Periksa kesehatan aplikasi dan database:

```bash
curl http://localhost:3000/api/health
```

Response sehat:

```json
{
  "status": "ok",
  "application": "ok",
  "database": "ok"
}
```

Jika database tidak tersedia, endpoint memberikan HTTP 503 dengan response aman
tanpa credential atau stack trace.

## Validasi project

Jalankan lint dan production build:

```bash
npm run lint
npm run build
```

Type checking juga dapat dijalankan terpisah:

```bash
npm run typecheck
```

## Menghentikan database

Hentikan container tanpa menghapus data:

```bash
docker compose stop
```

Jalankan kembali:

```bash
docker compose start
```

## Batas Phase 1

Area Upload Excel pada UI masih berupa placeholder yang jujur. Aplikasi belum
membaca, memvalidasi, atau menyimpan file `.xls` dan `.xlsx`. Fitur import Excel
adaptif dan schema database bisnis dijadwalkan pada Phase 2.
