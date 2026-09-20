const { createServer } = require('http');
const { parse } = require('url');
const fs = require('fs');
const path = require('path');

const PORT = parseInt(process.env.PORT || '3000', 10);

// Check if Next.js is available
let nextApp = null;
try {
  const next = require('next');
  const dev = process.env.NODE_ENV !== 'production';
  nextApp = next({ dev, hostname: '0.0.0.0', port: PORT });
} catch {
  // Not Next.js or next module not found
}

if (nextApp) {
  const handle = nextApp.getRequestHandler();
  nextApp.prepare().then(() => {
    createServer(async (req, res) => {
      try {
        const parsedUrl = parse(req.url, true);
        await handle(req, res, parsedUrl);
      } catch (err) {
        console.error('Error handling request:', err);
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
    }).listen(PORT, '0.0.0.0', () => {
      console.log(`> Server running on port ${PORT}`);
    });
  }).catch((err) => {
    console.error('Failed to prepare Next.js app:', err);
    process.exit(1);
  });
} else {
  // Fallback static file server for dist/ directory (e.g. Vite / React SPA)
  const distDir = path.join(__dirname, 'dist');
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
  };

  createServer((req, res) => {
    let filePath = path.join(distDir, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        filePath = path.join(distDir, 'index.html');
      }
      const ext = path.extname(filePath).toLowerCase();
      const contentType = mimeTypes[ext] || 'application/octet-stream';
      fs.readFile(filePath, (readErr, content) => {
        if (readErr) {
          res.writeHead(500);
          res.end('Error loading page');
        } else {
          res.writeHead(200, { 'Content-Type': contentType });
          res.end(content, 'utf-8');
        }
      });
    });
  }).listen(PORT, '0.0.0.0', () => {
    console.log(`> Static fallback server running on port ${PORT}`);
  });
}
