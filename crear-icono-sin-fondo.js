// Crea recursos/icono-app.png: ícono de la tarjeta instalada en el celular (una mini tarjeta).
// Uso:  node crear-icono.js
const sharp = require('sharp');
const QR = require('qrcode');
const path = require('path');

const RAIZ = __dirname;
const L = 1024;
const b64 = (b) => 'data:image/png;base64,' + b.toString('base64');

(async () => {
  const logo = await sharp(path.join(RAIZ, 'recursos', 'logo-elektra.png'))
    .trim({ background: '#FEDD00', threshold: 20 })
    .extend({ top: 22, bottom: 22, left: 30, right: 30, background: '#FEDD00' })
    .resize({ width: 300 }).png().toBuffer();
  const lm = await sharp(logo).metadata();
  const qr = await QR.toBuffer('https://ninno103515-oss.github.io/tarjetas-digitales/', { width: 260, margin: 0 });
  // Tarjeta de 760 x 480 (proporción de tarjeta real), girada un poco, sobre fondo negro
  const svg = `<svg width="${L}" height="${L}" viewBox="0 0 ${L} ${L}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="t" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2a2a2f"/><stop offset="1" stop-color="#050506"/></linearGradient>
    <linearGradient id="oro" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8a6a12"/><stop offset=".35" stop-color="#FEDD00"/><stop offset=".6" stop-color="#fff3a8"/><stop offset="1" stop-color="#C99A06"/></linearGradient>
    <radialGradient id="luz" cx=".5" cy=".42" r=".6"><stop offset="0" stop-color="#ED3024" stop-opacity=".35"/><stop offset="1" stop-color="#ED3024" stop-opacity="0"/></radialGradient>
    <clipPath id="l"><rect width="${lm.width}" height="${lm.height}" rx="16"/></clipPath>
  </defs>
  <g transform="translate(512 512) scale(1.3) translate(-380 -240)">
    
    <rect width="760" height="480" rx="44" fill="url(#t)" stroke="url(#oro)" stroke-width="10"/>
    <g transform="translate(56 64)"><image width="${lm.width}" height="${lm.height}" xlink:href="${b64(logo)}" clip-path="url(#l)"/></g>
    <rect x="58" y="${64 + lm.height + 54}" width="270" height="14" rx="7" fill="#fff"/>
    <rect x="58" y="${64 + lm.height + 92}" width="200" height="10" rx="5" fill="#ED3024"/>
    <rect x="58" y="${64 + lm.height + 128}" width="220" height="6" rx="3" fill="url(#oro)"/>
    <rect x="424" y="96" width="290" height="290" rx="26" fill="#fff"/>
    <image x="439" y="111" width="260" height="260" xlink:href="${b64(qr)}"/>
  </g>
</svg>`;
  await sharp(Buffer.from(svg)).png().toFile(path.join(RAIZ, 'recursos', process.argv[2] || 'icono-app.png'));
  console.log('Listo: recursos/icono-app.png');
})();
