import "server-only";

import { chromium } from "playwright-core";

export type PdfPageOptions = {
  widthMm: number;
  heightMm: number;
};

export type PdfRenderResult = {
  buffer: Buffer;
  pageCount: number;
};

const RENDER_TIMEOUT_MS = 30_000;
const BROWSER_LAUNCH_TIMEOUT_MS = 20_000;

function resolveExecutablePath(): string {
  const fromEnv = process.env.CHROME_PATH;
  if (fromEnv) {
    return fromEnv;
  }
  // Fallback umum untuk macOS/Linux.
  const candidates = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ];
  return candidates[0] ?? "";
}

/**
 * Merender halaman internal aplikasi menjadi PDF menggunakan Chromium
 * (playwright-core). Browser, page, dan context selalu dibersihkan di
 * `finally`. Memiliki timeout dan pesan error yang aman.
 */
export async function renderUrlToPdf(
  url: string,
  options: PdfPageOptions,
): Promise<PdfRenderResult> {
  let browser;
  try {
    const executablePath = resolveExecutablePath();
    browser = await chromium.launch({
      executablePath,
      headless: true,
      args: ["--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none"],
      timeout: BROWSER_LAUNCH_TIMEOUT_MS,
    });

    const context = await browser.newContext();
    const page = await context.newPage();

    // Hanya load font/logo dari origin internal (tidak ada asset internet).
    // `load` (bukan `networkidle`) agar tidak menunggu request latar Next.js
    // yang tidak pernah selesai pada mode dev.
    await page.goto(url, { waitUntil: "load", timeout: RENDER_TIMEOUT_MS });

    // Tunggu dokumen canonical siap + logo benar-benar berhasil dimuat.
    await page.waitForSelector('[data-delivery-note-document]', {
      timeout: RENDER_TIMEOUT_MS,
    });
    await page.waitForSelector('img[src*="logo-cv-pramudya-putra"]', {
      state: "attached",
      timeout: RENDER_TIMEOUT_MS,
    });
    await page.waitForFunction(
      () => {
        const logo = document.querySelector<HTMLImageElement>(
          'img[src*="logo-cv-pramudya-putra"]',
        );
        return Boolean(logo?.complete && logo.naturalWidth > 0);
      },
      undefined,
      { timeout: RENDER_TIMEOUT_MS },
    );
    await page.evaluate(async () => {
      const logo = document.querySelector<HTMLImageElement>(
        'img[src*="logo-cv-pramudya-putra"]',
      );
      await logo?.decode().catch(() => undefined);
    });
    await page.waitForLoadState("networkidle", { timeout: 8_000 }).catch(() => undefined);

    const buffer = await page.pdf({
      width: `${options.widthMm}mm`,
      height: `${options.heightMm}mm`,
      printBackground: true,
      preferCSSPageSize: true,
      pageRanges: "1-",
    });

    // Estimasi jumlah halaman dari PDF "/Type /Page" (tidak selalu akurat
    // untuk objek, tapi cukup untuk metadata sederhana).
    const pageCount = countPdfPages(buffer);

    await page.close();
    await context.close();

    return { buffer, pageCount };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("Timeout")) {
      throw new Error("Proses PDF melebihi batas waktu. Silakan coba kembali atau hubungi administrator.");
    }
    if (message.includes("Failed to launch") || message.includes("Executable doesn't exist")) {
      throw new Error("Renderer PDF tidak tersedia. Pastikan Chromium terpasang.");
    }
    throw new Error("PDF gagal dibuat. Silakan coba kembali.");
  } finally {
    if (browser) {
      await browser.close().catch(() => undefined);
    }
  }
}

function countPdfPages(buffer: Buffer): number {
  const text = buffer.toString("latin1");
  const matches = text.match(/\/Type\s*\/Page[^s]/g);
  return matches ? matches.length : 1;
}
