// Muestra las tarjetas en tu computadora antes de publicarlas.
// Uso:  npm run ver   y abre  http://localhost:8090
const http = require('http');
const fs = require('fs');
const path = require('path');

const RAIZ = __dirname;
const PUERTO = Number(process.env.PORT) || 8090;
const TIPOS = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.vcf': 'text/vcard; charset=utf-8' };

http.createServer((req, res) => {
  const ruta = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (ruta === '/') {
    res.writeHead(200, { 'Content-Type': TIPOS['.html'] });
    const lista = (carpeta) => fs.existsSync(path.join(RAIZ, carpeta)) ? fs.readdirSync(path.join(RAIZ, carpeta), { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => `<li><a href="/${carpeta}/${d.name}/">${d.name}</a></li>`).join('') : '';
    return res.end(`<meta charset="utf-8"><h1>Tarjetas</h1><h2>Se publican (docs)</h2><ul>${lista('docs')}</ul><h2>Solo prueba (vista-previa)</h2><ul>${lista('vista-previa')}</ul>`);
  }
  let archivo = path.normalize(path.join(RAIZ, ruta));
  if (!archivo.startsWith(RAIZ)) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(archivo) && fs.statSync(archivo).isDirectory()) archivo = path.join(archivo, 'index.html');
  if (!fs.existsSync(archivo)) { res.writeHead(404); return res.end('No encontrado'); }
  res.writeHead(200, { 'Content-Type': TIPOS[path.extname(archivo)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  fs.createReadStream(archivo).pipe(res);
}).listen(PUERTO, () => console.log(`Abre http://localhost:${PUERTO}`));
