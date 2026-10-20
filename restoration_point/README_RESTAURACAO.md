# Ponto de Restauração - Modo AI Studio (Raiz /)
Data: 2026-10-20

Este ponto de restauração permite reverter instantaneamente o projeto para o modo de desenvolvimento padrão do AI Studio (com raiz `/`), caso você queira voltar a trabalhar diretamente por aqui sem a subpasta do GitHub Pages.

## Arquivos salvos neste ponto de restauração:
1. `restoration_point/vite.config.ts.original` (com `base` na raiz `/`)
2. `restoration_point/urlHelper.ts.original`
3. `restoration_point/App.tsx.original`

## Como Restaurar se precisar voltar:
Basta copiar estes arquivos de volta para os seus caminhos originais:
- `restoration_point/vite.config.ts.original` -> `vite.config.ts`
- `restoration_point/urlHelper.ts.original` -> `src/lib/urlHelper.ts`
- `restoration_point/App.tsx.original` -> `src/App.tsx`
