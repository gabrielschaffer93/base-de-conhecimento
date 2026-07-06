# Melhorar conteúdo com IA — Roadmap

Acompanhe em qual etapa estamos. Cada etapa tem steps numerados.

## Etapa 1 — Formato de blocos (TipTap ↔ IA)
- [x] **1.1** Definir gramática de blocos (`[PARAGRAPH]`, `[IMAGE]`, `[CALLOUT]`, etc.)
- [x] **1.2** `serializeTipTapForAi` — TipTap JSON → texto para IA
- [x] **1.3** `parseAiBlocksToTipTap` — resposta IA → TipTap JSON
- [x] **1.4** `splitContentBySections` / `mergeSectionContents` — chunks por H2

## Etapa 2 — Backend (Edge Function)
- [x] **2.1** Edge Function `improve-content` com auth (editor/super_admin)
- [x] **2.2** Integração Bifrost (`BIFROST_API_KEY` só no backend)
- [x] **2.3** Prompts: `improve` | `simplify` | `custom`
- [ ] **2.4** Deploy + secret `BIFROST_API_KEY` no Supabase

## Etapa 3 — Service frontend
- [x] **3.1** `aiContentService.ts` — invoke da Edge Function
- [x] **3.2** Orquestração por seção (artigos longos)
- [x] **3.3** Tratamento de erros e mensagens PT-BR

## Etapa 4 — UI (modal antes/depois)
- [x] **4.1** `AiContentPreviewModal` — layout side-by-side / mobile stack
- [x] **4.2** Preview com `RichTextViewer` (antes | depois)
- [x] **4.3** Botões: Gostei / Não gostei / Instrução customizada
- [x] **4.4** Loading e progresso por seção

## Etapa 5 — Integração no editor
- [x] **5.1** Botão "Melhorar com IA" na toolbar
- [x] **5.2** Fluxo completo em `PostEditPage`
- [x] **5.3** Aplicar conteúdo aprovado via `updateField('content', …)`

## Fora de escopo (decisão de produto)
- Validador de mídia pós-IA — **não implementar** (uso baixo)

---

**Status atual:** Etapa 2 — step **2.4** (deploy + configurar secret no Supabase)
