// Gera os ícones PNG do PWA (sem dependências externas).
// Design: fundo vermelho da marca + bola de vôlei dourada com costuras vermelho-escuro.
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'public', 'icons');
mkdirSync(OUT, { recursive: true });

const VERMELHO = [200, 16, 46];
const ESCURO = [124, 14, 30];
const DOURADO = [233, 193, 105];
const BRANCO = [255, 255, 255];

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
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crc]);
}
function encodePNG(size, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0; // filter none
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

function mistura(base, cor, a) {
  return [
    Math.round(base[0] * (1 - a) + cor[0] * a),
    Math.round(base[1] * (1 - a) + cor[1] * a),
    Math.round(base[2] * (1 - a) + cor[2] * a)
  ];
}

function desenhar(size, { raioBola }) {
  const buf = Buffer.alloc(size * size * 4);
  const cx = size / 2;
  const cy = size / 2;
  const r = size * raioBola;
  const seamW = size * 0.028;

  // curvas de costura (quadráticas) no espaço da bola (-1..1)
  const seams = [
    [[-0.9, -0.2], [0.1, -0.6], [0.85, 0.35]],
    [[-0.75, 0.55], [0.0, -0.1], [0.65, -0.75]],
    [[-0.2, 0.95], [0.25, 0.15], [0.3, -0.95]]
  ];
  function distSeam(px, py) {
    let best = Infinity;
    for (const [p0, p1, p2] of seams) {
      for (let t = 0; t <= 1; t += 0.02) {
        const mt = 1 - t;
        const x = mt * mt * p0[0] + 2 * mt * t * p1[0] + t * t * p2[0];
        const y = mt * mt * p0[1] + 2 * mt * t * p1[1] + t * t * p2[1];
        const d = Math.hypot(px - x, py - y);
        if (d < best) best = d;
      }
    }
    return best;
  }

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let cor = VERMELHO;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.hypot(dx, dy);
      // anel branco fino ao redor da bola
      if (dist < r + size * 0.03 && dist >= r) {
        cor = BRANCO;
      }
      if (dist < r) {
        cor = DOURADO;
        // sombreamento sutil
        const sombra = 0.12 * (dy / r);
        cor = mistura(cor, ESCURO, Math.max(0, sombra));
        // costuras
        const nx = dx / r;
        const ny = dy / r;
        const ds = distSeam(nx, ny) * r;
        if (ds < seamW) cor = mistura(cor, ESCURO, Math.min(1, (seamW - ds) / seamW + 0.3));
      }
      const i = (y * size + x) * 4;
      buf[i] = cor[0];
      buf[i + 1] = cor[1];
      buf[i + 2] = cor[2];
      buf[i + 3] = 255;
    }
  }
  return buf;
}

const alvos = [
  { nome: 'icon-192.png', size: 192, raioBola: 0.34 },
  { nome: 'icon-512.png', size: 512, raioBola: 0.34 },
  { nome: 'icon-maskable-512.png', size: 512, raioBola: 0.28 },
  { nome: 'apple-touch-icon.png', size: 180, raioBola: 0.34 }
];
for (const a of alvos) {
  const rgba = desenhar(a.size, { raioBola: a.raioBola });
  writeFileSync(join(OUT, a.nome), encodePNG(a.size, rgba));
  console.log('gerado', a.nome);
}
