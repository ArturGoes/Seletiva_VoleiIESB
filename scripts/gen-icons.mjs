// Gera os ícones PNG do PWA a partir do logo oficial do IESB (public/iesb-logo.png),
// compondo-o sobre um fundo radial vermelho→marrom da marca. Sem dependências externas.
//
// Requer apenas Node (usa uma decodificação/encodificação PNG mínima em zlib).
// Se o logo mudar, rode: npm run icons
import { deflateSync, inflateSync } from 'node:zlib';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT = join(ROOT, 'public', 'icons');
mkdirSync(OUT, { recursive: true });

// ---- PNG mínimo (RGBA, sem interlace) ----
function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1;
  }
  return ~c >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const t = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crc]);
}
function readChunks(buf) {
  let o = 8;
  const chunks = {};
  while (o < buf.length) {
    const len = buf.readUInt32BE(o);
    const type = buf.toString('ascii', o + 4, o + 8);
    const data = buf.subarray(o + 8, o + 8 + len);
    chunks[type] = chunks[type] ? Buffer.concat([chunks[type], data]) : Buffer.from(data);
    o += 12 + len;
  }
  return chunks;
}
function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}
function decodePNG(buf) {
  const c = readChunks(buf);
  const ihdr = c.IHDR;
  const w = ihdr.readUInt32BE(0), h = ihdr.readUInt32BE(4);
  const color = ihdr[9];
  const ch = color === 6 ? 4 : color === 2 ? 3 : 1;
  const raw = inflateSync(c.IDAT);
  const stride = w * ch;
  const out = Buffer.alloc(w * h * 4);
  const prev = Buffer.alloc(stride);
  let o = 0;
  const cur = Buffer.alloc(stride);
  for (let y = 0; y < h; y++) {
    const f = raw[o++];
    for (let x = 0; x < stride; x++) {
      const rawv = raw[o + x];
      const a = x >= ch ? cur[x - ch] : 0;
      const b = prev[x];
      const cc = x >= ch ? prev[x - ch] : 0;
      let v;
      if (f === 0) v = rawv;
      else if (f === 1) v = rawv + a;
      else if (f === 2) v = rawv + b;
      else if (f === 3) v = rawv + ((a + b) >> 1);
      else v = rawv + paeth(a, b, cc);
      cur[x] = v & 255;
    }
    o += stride;
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const s = x * ch;
      out[i] = cur[s];
      out[i + 1] = cur[ch >= 3 ? s + 1 : s];
      out[i + 2] = cur[ch >= 3 ? s + 2 : s];
      out[i + 3] = ch === 4 ? cur[s + 3] : 255;
    }
    cur.copy(prev);
  }
  return { w, h, data: out };
}
function encodePNG(size, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6;
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

// amostragem bilinear do logo (com alpha)
function sample(src, sx, sy) {
  const x = Math.max(0, Math.min(src.w - 1, sx));
  const y = Math.max(0, Math.min(src.h - 1, sy));
  const i = ((y | 0) * src.w + (x | 0)) * 4;
  return [src.data[i], src.data[i + 1], src.data[i + 2], src.data[i + 3]];
}

const logo = decodePNG(readFileSync(join(ROOT, 'public', 'iesb-logo.png')));
const INNER = [200, 16, 46], OUTER = [94, 10, 21];

function render(size, logoFrac, rounded) {
  const buf = Buffer.alloc(size * size * 4);
  const cx = size / 2, maxd = (size / 2) * 1.42;
  const ls = Math.round(size * logoFrac);
  const off = (size - ls) / 2;
  const rad = size * 0.22;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const d = Math.min(1, Math.hypot(x - cx, y - cx) / maxd);
      let r = INNER[0] * (1 - d) + OUTER[0] * d;
      let g = INNER[1] * (1 - d) + OUTER[1] * d;
      let b = INNER[2] * (1 - d) + OUTER[2] * d;
      // compõe o logo
      if (x >= off && x < off + ls && y >= off && y < off + ls) {
        const [lr, lg, lb, la] = sample(logo, ((x - off) / ls) * logo.w, ((y - off) / ls) * logo.h);
        const a = la / 255;
        r = lr * a + r * (1 - a);
        g = lg * a + g * (1 - a);
        b = lb * a + b * (1 - a);
      }
      let alpha = 255;
      if (rounded) {
        // cantos arredondados (maskable)
        const dx = Math.max(rad - x, x - (size - rad), 0);
        const dy = Math.max(rad - y, y - (size - rad), 0);
        if (dx > 0 && dy > 0 && Math.hypot(dx, dy) > rad) alpha = 0;
      }
      const i = (y * size + x) * 4;
      buf[i] = r; buf[i + 1] = g; buf[i + 2] = b; buf[i + 3] = alpha;
    }
  }
  return buf;
}

const alvos = [
  ['icon-192.png', 192, 0.82, false],
  ['icon-512.png', 512, 0.82, false],
  ['icon-maskable-512.png', 512, 0.62, true],
  ['apple-touch-icon.png', 180, 0.82, false]
];
for (const [nome, size, frac, rounded] of alvos) {
  writeFileSync(join(OUT, nome), encodePNG(size, render(size, frac, rounded)));
  console.log('gerado', nome);
}
