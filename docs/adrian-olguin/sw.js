// Guarda la tarjeta en el celular para que abra aunque no haya internet
const CACHE = 'tarjeta-adrian-olguin-8d9ce069';
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(["./","../estilos.css?v=8d9ce069","../tarjeta.js?v=8d9ce069","../estilos-compacta.css?v=8d9ce069","foto.jpg","contacto.vcf","../logo-elektra.png","../banco-azteca.png","../sol-elektra.png","../iconos/whatsapp.png","../iconos/app-elektra.png","../iconos/credito.png","../iconos/ubicacion.png","../iconos/compartir.png","../productos/movilidad.png","../productos/hogar.png","../productos/efectivo.png","../productos/conectividad.png"])).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
// Primero internet (para ver siempre lo más nuevo); si no hay, lo guardado
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then((r) => { const copia = r.clone(); if (r.ok && new URL(e.request.url).origin === location.origin) caches.open(CACHE).then((c) => c.put(e.request, copia)); return r; }).catch(() => caches.match(e.request, { ignoreSearch: true })));
});
