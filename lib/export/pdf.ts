import { NoteOutput } from '@/lib/ai/validators/block-schema';
import { renderToStaticHtml } from './static-html';

// @ts-ignore - puppeteer-core is optional and loaded dynamically
import puppeteerType from 'puppeteer-core';

export async function renderToPdf(note: NoteOutput): Promise<Buffer> {
  const html = renderToStaticHtml(note);
  try {
    const puppeteer = (await import(/* webpackIgnore: true */ 'puppeteer-core' as any)).default || puppeteerType;
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({ format: 'A4', margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' } });
    await browser.close();
    return pdf as Buffer;
  } catch (err) {
    console.warn('PDF generation via puppeteer failed, returning HTML fallback:', err);
    return Buffer.from(html, 'utf-8');
  }
}

// Note: puppeteer-core chỉ hoạt động trong môi trường có sẵn Chromium binary.
// Nếu deploy trên Vercel Serverless, cần dùng @sparticuz/chromium thay thế.
// Nếu môi trường dev không có puppeteer, fallback tự động trả HTML printable.
