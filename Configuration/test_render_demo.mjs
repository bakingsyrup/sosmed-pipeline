import path from 'path';
import { fileURLToPath } from 'url';
import { renderCarousel } from './utils/carousel_renderer.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const demoSlides = [
  {
    tag: "RISK MANAGEMENT",
    headline: "Bitcoin Sideways 2 Bulan Lebih: Ini Trik Amankan Porto Pas Crash!",
    subtext: "Banyak retail bingung pas market anjlok: mau jual rugi, atau pasrah porto minus 50%? Ada opsi ketiga: Delta Neutral Hedging."
  },
  {
    tag: "MEKANISME HEDGING",
    headline: "Apa Itu Teknik Delta Neutral Hedging?",
    subtext: "Buka posisi Short di Futures senilai koin yang kamu pegang di Spot. Rugi di spot akan diimbangi cuan dari short.",
    comparison: {
      posTitle: "SPOT WALLET",
      posVal: "1 BTC ($60,000)",
      negTitle: "FUTURES SHORT",
      negVal: "1 BTC ($60,000)"
    }
  },
  {
    tag: "PERHITUNGAN MATEMATIKA",
    headline: "Contoh Riil Pas Harga Anjlok ke $40,000",
    subtext: "Nilai portofolio kamu tetap utuh $60,000 tanpa perlu jual koin BTC spot sama sekali.",
    comparison: {
      posTitle: "SHORT FUTURES CUAN",
      posVal: "+$20,000",
      negTitle: "SPOT WALLET RUGI",
      negVal: "-$20,000"
    }
  },
  {
    tag: "RULES KESELAMATAN",
    headline: "2 Aturan Wajib Agar Tidak Margin Call",
    subtext: "1. Leverage Maksimal 1x - 2x (Proteksi modal, bukan cari cuan instan).<br>2. Wajib Pakai Isolated Margin agar wallet utama aman."
  },
  {
    tag: "OWNED CTA",
    headline: "Kunci Selamat di Kripto: Pintar Jaga Modal Pas Bear Market",
    subtext: "Cuan bull run tidak ada artinya kalau porto habis tergerus. Follow @SilvesterAdAstra untuk riset pasar berikutnya!"
  }
];

const outputFolder = path.join(__dirname, '..', 'ig-pipeline', '03-Ready', 'rendered-carousels');
const baseFileName = 'DEMO_Hedging_Futures';

async function runDemo() {
  console.log('--- STARTING PLAYWRIGHT CAROUSEL RENDER TEST ---');
  await renderCarousel(demoSlides, outputFolder, baseFileName);
  console.log('--- TEST COMPLETED SUCCESSFULLY ---');
}

runDemo().catch(console.error);
