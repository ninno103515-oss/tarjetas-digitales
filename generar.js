// Genera una tarjeta digital (index.html + contacto.vcf + qr.png) por cada asesor de asesores.json.
// Uso:  npm run generar
//  - Asesores con "publicar": true  -> carpeta docs/  (lo que se publica en internet)
//  - Asesores con "publicar": false -> carpeta vista-previa/  (solo para probar en tu computadora)

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const QRCode = require('qrcode');

const RAIZ = __dirname;
const SALIDA_PUBLICA = path.join(RAIZ, 'docs');
const SALIDA_PRUEBA = path.join(RAIZ, 'vista-previa');
const CARPETA_QR = path.join(RAIZ, 'codigos-qr');

const config = JSON.parse(fs.readFileSync(path.join(RAIZ, 'asesores.json'), 'utf8'));
const plantilla = fs.readFileSync(path.join(RAIZ, 'plantilla', 'tarjeta.html'), 'utf8');
const urlBase = config.sitio.urlBase.replace(/\/+$/, '');

// Catálogo de productos que se pueden poner en "productos" de cada asesor.
const PRODUCTOS = {
  movilidad: {
    titulo: 'Movilidad',
    detalle: 'Motos y bicicletas',
    icono: '<circle cx="5.5" cy="16.5" r="3"/><circle cx="18.5" cy="16.5" r="3"/><path d="M5.5 16.5L9 10h5l4.5 6.5"/><path d="M14 10l-1.5-4H16"/><path d="M7 10h4"/>'
  },
  hogar: {
    titulo: 'Hogar',
    detalle: 'Muebles, línea blanca y electrodomésticos',
    icono: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>'
  },
  conectividad: {
    titulo: 'Conectividad',
    detalle: 'Celulares, tablets y laptops',
    icono: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>'
  }
};

const avisos = [];

const escapar = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const esMarcador = (v) => !v || String(v).trim().startsWith('[');
const soloDigitos = (t) => String(t || '').replace(/\D/g, '');
const telInternacional = (t) => { const d = soloDigitos(t); return d.length === 10 ? '52' + d : d; };
const telBonito = (t) => { const d = soloDigitos(t); return d.length === 10 ? `${d.slice(0, 2)} ${d.slice(2, 6)} ${d.slice(6)}` : t; };

// Rellena {{campo}} en la plantilla (con función, para que "$" en los datos no se altere).
const rellenar = (texto, datos) => texto.replace(/\{\{(\w+)\}\}/g, (_, k) => {
  if (!(k in datos)) throw new Error(`La plantilla usa {{${k}}} pero no existe ese dato`);
  return datos[k];
});

// ---------- vCard (.vcf) ----------
const vEscapar = (t) => String(t).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1');
const doblar = (linea) => { // las líneas largas se parten en renglones que empiezan con espacio
  const partes = [];
  for (let i = 0; i < linea.length; i += 60) partes.push(linea.slice(i, i + 60));
  return partes.join('\r\n ');
};
function crearVCard(a, urlTarjeta, fotoBase64) {
  const lineas = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${vEscapar(a.apellidos)};${vEscapar(a.nombre)};;;`,
    `FN:${vEscapar(`${a.nombre} ${a.apellidos}`)}`,
    `ORG:${vEscapar(a.sucursal)}`,
    `TITLE:${vEscapar(a.puesto)}`,
    `TEL;TYPE=CELL,VOICE:+${telInternacional(a.telefono)}`
  ];
  if (soloDigitos(a.whatsapp) !== soloDigitos(a.telefono)) lineas.push(`TEL;TYPE=CELL:+${telInternacional(a.whatsapp)}`);
  lineas.push(`URL:${urlTarjeta}`);
  lineas.push(`NOTE:${vEscapar(`Horario: ${a.horario}. Tarjeta digital: ${urlTarjeta}`)}`);
  if (fotoBase64) lineas.push(`PHOTO;ENCODING=b;TYPE=JPEG:${fotoBase64}`);
  lineas.push('END:VCARD');
  return lineas.map(doblar).join('\r\n') + '\r\n';
}

// ---------- Código QR para imprimir ----------
async function crearQR(url, nombre, destinoSimple, destinoImprimir) {
  await QRCode.toFile(destinoSimple, url, { width: 1024, margin: 4, errorCorrectionLevel: 'M', color: { dark: '#000000', light: '#FFFFFF' } });
  // Versión con marco y nombre, lista para imprimir (1200 x 1500 px)
  const qr = await QRCode.toBuffer(url, { width: 900, margin: 2, errorCorrectionLevel: 'M' });
  const logo = await sharp(path.join(RAIZ, config.sitio.logo)).resize({ width: 520 }).toBuffer();
  const texto = `<svg width="1200" height="1500" xmlns="http://www.w3.org/2000/svg">
    <rect width="1200" height="1500" fill="#FFFFFF"/>
    <rect width="1200" height="300" fill="#FEDD00"/>
    <rect x="0" y="1290" width="1200" height="210" fill="#ED3024"/>
    <text x="600" y="1370" font-family="Segoe UI, Arial, sans-serif" font-size="56" font-weight="700" fill="#FFFFFF" text-anchor="middle">${escapar(nombre)}</text>
    <text x="600" y="1440" font-family="Segoe UI, Arial, sans-serif" font-size="40" fill="#FFFFFF" text-anchor="middle">Escanea para ver mi tarjeta digital</text>
  </svg>`;
  await sharp(Buffer.from(texto))
    .composite([
      { input: logo, top: 4, left: 340 },
      { input: qr, top: 345, left: 150 }
    ])
    .png()
    .toFile(destinoImprimir);
}

// ---------- Botón (activo o con marcador si falta el link) ----------
function boton({ clase = '', href, icono, titulo, detalle, externo = true, extra = '' }, nombreDato, a) {
  if (esMarcador(href)) {
    avisos.push(`  - ${a.ruta}: falta "${nombreDato}" (botón "${titulo}" desactivado)`);
    return `<span class="boton falta" aria-disabled="true"><span class="icono" aria-hidden="true">${icono}</span><span class="texto"><strong>${escapar(titulo)}</strong><small>${escapar(href || '[FALTA ' + nombreDato.toUpperCase() + ']')}</small></span></span>`;
  }
  const destino = externo ? ' target="_blank" rel="noopener"' : '';
  return `<a class="boton ${clase}" href="${escapar(href)}"${destino}${extra}><span class="icono" aria-hidden="true">${icono}</span><span class="texto"><strong>${escapar(titulo)}</strong>${detalle ? `<small>${escapar(detalle)}</small>` : ''}</span><svg class="flecha" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></a>`;
}

const svg = (interior, relleno = false) => `<svg viewBox="0 0 24 24" class="${relleno ? 'relleno' : ''}">${interior}</svg>`;
const ICONOS = {
  whatsapp: svg('<path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2zm5.8 14.05c-.24.68-1.42 1.3-1.95 1.35-.5.05-.97.24-3.28-.68-2.78-1.1-4.54-3.95-4.68-4.13-.13-.18-1.1-1.47-1.1-2.8 0-1.33.7-1.98.95-2.25.24-.27.53-.33.71-.33l.51.01c.16 0 .39-.06.6.46.24.56.8 1.93.87 2.07.07.14.12.3.02.48-.09.18-.14.3-.27.46-.14.16-.29.36-.41.48-.14.14-.28.29-.12.56.16.27.71 1.17 1.52 1.9 1.05.93 1.93 1.22 2.2 1.36.27.14.43.12.59-.07.16-.18.68-.8.86-1.07.18-.27.36-.23.6-.14.25.09 1.58.75 1.85.88.27.14.45.2.52.32.07.11.07.66-.17 1.33z"/>', true),
  credito: svg('<rect x="2" y="5" width="20" height="14" rx="2.5"/><path d="M2 10h20"/><path d="M6 15h4"/>'),
  telefono: svg('<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.8 2z"/>'),
  mapa: svg('<path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>'),
  contacto: svg('<circle cx="10" cy="8" r="4"/><path d="M2 21c0-4 3.6-7 8-7 1.4 0 2.7.3 3.8.8"/><path d="M19 14v6M16 17h6"/>'),
  compartir: svg('<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/>')
};

async function generarAsesor(a) {
  if (!a.ruta || !/^[a-z0-9-]+$/.test(a.ruta)) throw new Error(`Ruta inválida "${a.ruta}": usa solo minúsculas, números y guiones (ej. juan-perez)`);
  const base = a.publicar ? SALIDA_PUBLICA : SALIDA_PRUEBA;
  const dir = path.join(base, a.ruta);
  fs.mkdirSync(dir, { recursive: true });

  const nombreCompleto = `${a.nombre} ${a.apellidos}`;
  const urlTarjeta = `${urlBase}/${a.ruta}/`;

  // Foto: rectángulo vertical (4:5) centrado en la cara
  let fotoHtml, fotoBase64 = '', ogImagen = `${urlBase}/logo-elektra.png`;
  if (a.foto && fs.existsSync(path.join(RAIZ, a.foto))) {
    // "fotoRecorte" (opcional): rectángulo exacto a recortar, en pixeles de la foto original
    // ({ izquierda, arriba, ancho, alto }). Sin él, se elige automáticamente la cara.
    const r = a.fotoRecorte;
    const abrir = () => {
      const img = sharp(path.join(RAIZ, a.foto)).rotate();
      return r ? img.extract({ left: r.izquierda, top: r.arriba, width: r.ancho || r.tamano, height: r.alto || r.tamano }) : img;
    };
    const ajuste = { fit: 'cover', position: r ? 'centre' : sharp.strategy.attention };
    await abrir().resize(480, 600, ajuste).jpeg({ quality: 84, mozjpeg: true }).toFile(path.join(dir, 'foto.jpg'));
    fotoBase64 = (await abrir().resize(240, 240, { fit: 'cover', position: r ? 'north' : sharp.strategy.attention }).jpeg({ quality: 70 }).toBuffer()).toString('base64');
    fotoHtml = `<img class="foto" src="foto.jpg" alt="Foto de ${escapar(nombreCompleto)}" width="480" height="600">`;
    ogImagen = `${urlTarjeta}foto.jpg`;
  } else {
    if (a.foto) avisos.push(`  - ${a.ruta}: no encontré la foto "${a.foto}"`);
    else avisos.push(`  - ${a.ruta}: sin foto (se muestran sus iniciales)`);
    const iniciales = (a.nombre[0] || '') + (a.apellidos.replace(/\(.*\)/, '').trim()[0] || '');
    fotoHtml = `<div class="foto iniciales" aria-hidden="true">${escapar(iniciales.toUpperCase())}</div>`;
  }

  const wa = esMarcador(a.whatsapp) ? a.whatsapp : `https://wa.me/${telInternacional(a.whatsapp)}?text=${encodeURIComponent(a.mensajeWhatsApp || '')}`;
  const tel = esMarcador(a.telefono) ? a.telefono : `tel:+${telInternacional(a.telefono)}`;
  const nombreArchivoVcf = `${a.nombre}-${a.apellidos.split(' ')[0]}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9-]/g, '') + '.vcf';

  const botones = [
    boton({ clase: 'boton-whatsapp', href: wa, icono: ICONOS.whatsapp, titulo: `${a.nombre} ${a.apellidos.split(' ')[0]}` }, 'whatsapp', a),
    boton({ clase: 'boton-credito', href: a.linkCredito, icono: ICONOS.credito, titulo: 'Tramita aquí tu crédito' }, 'linkCredito', a),
    boton({ href: tel, icono: ICONOS.telefono, titulo: 'Llámame', externo: false }, 'telefono', a),
    boton({ href: a.mapa, icono: ICONOS.mapa, titulo: 'Cómo llegar' }, 'mapa', a),
    boton({ href: 'contacto.vcf', icono: ICONOS.contacto, titulo: 'Guardar contacto', externo: false, extra: ` download="${nombreArchivoVcf}"` }, 'contacto', a),
    `<button class="boton" type="button" id="compartir" data-url="${escapar(urlTarjeta)}" data-texto="${escapar(`${nombreCompleto} · ${a.puesto} en ${a.sucursal}`)}"><span class="icono" aria-hidden="true">${ICONOS.compartir}</span><span class="texto"><strong>Compartir</strong></span><svg class="flecha" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></button>`
  ].join('\n      ');

  const productosHtml = (a.productos || []).map((p) => {
    const info = PRODUCTOS[p];
    if (!info) { avisos.push(`  - ${a.ruta}: producto desconocido "${p}" (usa: ${Object.keys(PRODUCTOS).join(', ')})`); return ''; }
    return `<li><span class="icono-producto" aria-hidden="true">${svg(info.icono)}</span><span><strong>${info.titulo}</strong><small>${info.detalle}</small></span></li>`;
  }).join('\n        ');
  const requisitosHtml = (a.requisitos || []).map((r) => `<li>${escapar(r)}</li>`).join('\n        ');

  const html = rellenar(plantilla, {
    nombreCompleto: escapar(nombreCompleto),
    puesto: escapar(a.puesto),
    sucursal: escapar(a.sucursal),
    empresa: escapar(config.sitio.empresa),
    horario: escapar(a.horario),
    urlTarjeta: escapar(urlTarjeta),
    ogImagen: escapar(ogImagen),
    fotoHtml,
    botones,
    productosHtml,
    requisitosHtml,
    aviso: a.publicar ? '' : '<p class="ejemplo">Tarjeta de EJEMPLO · no publicada</p>'
  });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  fs.writeFileSync(path.join(dir, 'contacto.vcf'), crearVCard(a, urlTarjeta, fotoBase64));

  fs.mkdirSync(CARPETA_QR, { recursive: true });
  await crearQR(urlTarjeta, nombreCompleto.replace(/\s*\(EJEMPLO\)/, ''), path.join(dir, 'qr.png'), path.join(CARPETA_QR, `${a.ruta}.png`));

  console.log(`✔ ${a.publicar ? 'PUBLICAR ' : 'PRUEBA   '} ${a.ruta.padEnd(20)} ${a.publicar ? urlTarjeta : path.relative(RAIZ, path.join(dir, 'index.html'))}`);
}

async function copiarComunes(destino) {
  fs.mkdirSync(destino, { recursive: true });
  // Logo completo, sin deformar ni cambiar colores; solo se reduce el margen amarillo para que se vea más grande
  await sharp(path.join(RAIZ, config.sitio.logo)).trim({ background: '#FEDD00', threshold: 20 })
    .extend({ top: 18, bottom: 6, left: 18, right: 18, background: '#FEDD00' }).png().toFile(path.join(destino, 'logo-elektra.png'));
  fs.copyFileSync(path.join(RAIZ, 'recursos', 'sol-elektra.png'), path.join(destino, 'sol-elektra.png'));
  fs.copyFileSync(path.join(RAIZ, 'recursos', 'banco-azteca.png'), path.join(destino, 'banco-azteca.png'));
  fs.copyFileSync(path.join(RAIZ, 'plantilla', 'estilos.css'), path.join(destino, 'estilos.css'));
  fs.copyFileSync(path.join(RAIZ, 'plantilla', 'tarjeta.js'), path.join(destino, 'tarjeta.js'));
  fs.copyFileSync(path.join(RAIZ, 'plantilla', 'inicio.html'), path.join(destino, 'index.html'));
  fs.writeFileSync(path.join(destino, '.nojekyll'), '');
}

(async () => {
  const rutas = new Set();
  for (const a of config.asesores) {
    if (rutas.has(a.ruta)) throw new Error(`La ruta "${a.ruta}" está repetida en asesores.json`);
    rutas.add(a.ruta);
  }
  // Se borran y se vuelven a crear las carpetas generadas (no edites nada a mano dentro de ellas)
  for (const d of [SALIDA_PUBLICA, SALIDA_PRUEBA, CARPETA_QR]) fs.rmSync(d, { recursive: true, force: true });
  await copiarComunes(SALIDA_PUBLICA);
  await copiarComunes(SALIDA_PRUEBA);

  for (const a of config.asesores) await generarAsesor(a);

  if (avisos.length) console.log('\n⚠ Revisa estos datos pendientes:\n' + avisos.join('\n'));
  console.log(`\nListo. Códigos QR para imprimir en: codigos-qr/`);
})().catch((e) => { console.error('\n✖ Error: ' + e.message); process.exit(1); });
