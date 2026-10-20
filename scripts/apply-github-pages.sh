#!/bin/bash
# Configura o projeto para o modo GitHub Pages (subpasta /Recibos-3-SGB/)
node -e "
const fs = require('fs');

// 1. vite.config.ts
let vite = fs.readFileSync('vite.config.ts', 'utf8');
if (!vite.includes(\"base: '/Recibos-3-SGB/'\")) {
  vite = vite.replace('plugins: [react(), tailwindcss()],', \"base: '/Recibos-3-SGB/',\n    plugins: [react(), tailwindcss()],\");
  fs.writeFileSync('vite.config.ts', vite);
}

// 2. src/lib/urlHelper.ts
let urlH = fs.readFileSync('src/lib/urlHelper.ts', 'utf8');
urlH = urlH.replace(
  /const cleanOrigin = origin\.replace\(.*?\);[\s\S]*?return `\${cleanOrigin}\/\?recibo=\${encodeURIComponent\(receiptId\)}`;/,
  'const currentPath = window.location.pathname.replace(/index\\\\.html$/i, \\'\\');\\n  const cleanPath = currentPath.endsWith(\\'/\\') ? currentPath : `\${currentPath}/`;\\n  return `\${window.location.origin}\${cleanPath}?recibo=\${encodeURIComponent(receiptId)}`;'
);
fs.writeFileSync('src/lib/urlHelper.ts', urlH);

// 3. src/App.tsx
let app = fs.readFileSync('src/App.tsx', 'utf8');
app = app.replace(\"window.history.pushState({}, '', `/?recibo=\${id}`);\", \"window.history.pushState({}, '', `\${window.location.pathname}?recibo=\${id}`);\");
fs.writeFileSync('src/App.tsx', app);

console.log('✅ Configuração para GitHub Pages (/Recibos-3-SGB/) aplicada com sucesso!');
"
