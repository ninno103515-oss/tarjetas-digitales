// Revisa las tarjetas generadas: links que responden, archivo .vcf y que el QR se pueda leer.
// Uso:  npm run probar   (después de  npm run generar)
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const jsQR = require('jsqr');

const RAIZ = __dirname;
const config = JSON.parse(fs.readFileSync(path.join(RAIZ, 'asesores.json'), 'utf8'));
const urlBase = config.sitio.urlBase.replace(/\/+$/, '');
let fallas = 0;
const ok = (m) => console.log('  ✔ ' + m);
const mal = (m) => { fallas++; console.log('  ✖ ' + m); };

async function revisarLink(nombre, url) {
  try {
    const r = await fetch(url, { redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 14) Mobile' } });
    if (r.status < 400) ok(`${nombre}: responde ${r.status}${r.url !== url ? ' → ' + r.url.slice(0, 90) : ''}`);
    else mal(`${nombre}: responde ${r.status} (${url})`);
  } catch (e) { mal(`${nombre}: no abre (${e.message})`); }
}

(async () => {
  const enLinea = process.argv.includes('--en-linea');
  for (const a of config.asesores) {
    const dir = path.join(RAIZ, a.publicar ? 'docs' : 'vista-previa', a.ruta);
    const urlTarjeta = `${urlBase}/${a.ruta}/`;
    console.log(`\n${a.ruta} ${a.publicar ? '' : '(prueba, no se publica)'}`);
    for (const f of ['index.html', 'contacto.vcf', 'qr.png']) fs.existsSync(path.join(dir, f)) ? ok(`existe ${f}`) : mal(`falta ${f}`);

    // QR: se lee y apunta a la dirección correcta
    const { data, info } = await sharp(path.join(dir, 'qr.png')).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const leido = jsQR(new Uint8ClampedArray(data), info.width, info.height);
    leido && leido.data === urlTarjeta ? ok(`QR se lee: ${leido.data}`) : mal(`QR no coincide: ${leido ? leido.data : 'no se pudo leer'}`);
    const imp = path.join(RAIZ, 'codigos-qr', `${a.ruta}.png`);
    const d2 = await sharp(imp).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const l2 = jsQR(new Uint8ClampedArray(d2.data), d2.info.width, d2.info.height);
    l2 && l2.data === urlTarjeta ? ok('QR para imprimir se lee') : mal('QR para imprimir no se lee');

    // vCard
    const vcf = fs.readFileSync(path.join(dir, 'contacto.vcf'), 'utf8').replace(/\r\n /g, '');
    const tiene = (re, m) => (re.test(vcf) ? ok(m) : mal(m));
    tiene(/^BEGIN:VCARD\r\nVERSION:3\.0/, 'vCard válida (3.0)');
    tiene(new RegExp(`TEL;TYPE=CELL,VOICE:\\+52${a.telefono}`), 'vCard con teléfono');
    tiene(/^TITLE:.+/m, 'vCard con puesto');
    tiene(/^ORG:.+/m, 'vCard con sucursal');

    // Links de los botones
    const html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
    const links = [...html.matchAll(/<a class="boton[^"]*" href="([^"]+)"/g)].map((m) => m[1].replace(/&amp;/g, '&'));
    for (const l of links) {
      if (l.startsWith('tel:')) l === `tel:+52${a.telefono}` ? ok(`Llamar: ${l}`) : mal(`Teléfono raro: ${l}`);
      else if (l.startsWith('http')) await revisarLink(l.split('/')[2], l);
    }
    const faltan = (html.match(/class="boton falta"/g) || []).length;
    if (faltan) console.log(`  ⚠ ${faltan} botón(es) desactivado(s) por datos faltantes`);
    if (enLinea && a.publicar) {
      await revisarLink('Tarjeta publicada', urlTarjeta);
      await revisarLink('vCard publicada', urlTarjeta + 'contacto.vcf');
      await revisarLink('QR publicado', urlTarjeta + 'qr.png');
    }
  }
  console.log(fallas ? `\n${fallas} problema(s) encontrados.` : '\nTodo bien.');
  process.exit(fallas ? 1 : 0);
})();
