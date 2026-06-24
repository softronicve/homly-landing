// Servidor estático sin dependencias. Uso: node serve.cjs <port> <root>
const http = require('http');
const fs = require('fs');
const path = require('path');
const port = parseInt(process.argv[2] || '8080', 10);
const root = path.resolve(process.argv[3] || process.cwd());
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2',
};
http.createServer((req, res) => {
  let p = decodeURIComponent((req.url || '/').split('?')[0]);
  if (p === '/' || p === '') p = '/index.html';
  const file = path.join(root, path.normalize(p));
  if (!file.startsWith(root)) { res.writeHead(403); return res.end('403'); }
  fs.readFile(file, (err, data) => {
    if (err) {
      // Rutas del router (sin extensión) → index.html
      if (!path.extname(p)) {
        return fs.readFile(path.join(root, 'index.html'), (e2, idx) => {
          if (e2) { res.writeHead(404); return res.end('404'); }
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(idx);
        });
      }
      res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('404 ' + p);
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(port, '127.0.0.1', () => console.log(`http://127.0.0.1:${port}`));
