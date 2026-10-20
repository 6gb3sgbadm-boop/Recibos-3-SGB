#!/bin/bash
# Restaura o projeto para o modo nativo do AI Studio (raiz /)
cp restoration_point/vite.config.ts.original vite.config.ts
cp restoration_point/urlHelper.ts.original src/lib/urlHelper.ts
cp restoration_point/App.tsx.original src/App.tsx
echo "✅ Projeto restaurado com sucesso para o modo AI Studio (raiz /)!"
