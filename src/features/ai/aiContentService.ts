import {
  isEmptyDoc,
  markdownToTiptap,
  tiptapToMarkdown,
  type TipTapDoc,
} from '@/features/ai/aiDocumentFormat'

export type AiImproveMode = 'improve' | 'simplify' | 'custom'

export interface AiImproveProgress {
  currentSection: number
  totalSections: number
  sectionLabel: string
}

const BIFROST_MODEL = import.meta.env.VITE_BIFROST_MODEL ?? 'vertex/gemini-2.5-flash'
const BIFROST_URL = import.meta.env.VITE_BIFROST_URL ?? 'https://proxy.loft.ai/v1/chat/completions'
const MAX_RETRIES = 15
const RETRY_DELAY_MS = 4_000

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function decodeBifrostKey(): string {
  const encoded = import.meta.env.VITE_BIFROST_TOKEN ?? ''
  if (!encoded) {
    throw new Error('IA não configurada. Defina VITE_BIFROST_TOKEN no .env.')
  }
  return atob(encoded)
}

const SYSTEM_PROMPT = `Você é um editor sênior de artigos técnicos em português brasileiro para uma base de conhecimento.

Sua missão é melhorar a **apresentação visual**, clareza e organização do texto.

REGRAS DE FORMATAÇÃO:
- Use **negrito** para termos-chave, nomes de campos, botões e conceitos importantes
- Use *itálico* para ênfases suaves
- Use <u>sublinhado</u> apenas quando realmente necessário (ex.: títulos de documentos)
- Organize passos em listas numeradas (1. 2. 3.) quando houver procedimentos
- Use listas com marcadores (- item) para enumerações
- Use listas de tarefas com - [ ] pendente e - [x] concluída quando fizer sentido
- Use tabelas markdown (| Coluna | Valor |) para dados tabulares
- Para centralizar ou alinhar um parágrafo/título, use <!-- align:center --> na linha anterior
- Quando houver uma dica prática, use callout: :::tip seguido do conteúdo e ::: para fechar
- Quando houver um aviso importante, use: :::warning seguido do conteúdo e ::: para fechar
- Quando houver conteúdo extra/complementar que pode ser colapsado, use:
  <details>
  <summary>Título da seção</summary>
  Conteúdo aqui
  </details>

REGRAS DE CONTEÚDO:
- Melhore a clareza e gramática
- Não invente informações — preserve todos os fatos
- Preserve TODAS as mídias: linhas com <!-- IMAGE ... --> e <!-- VIDEO ... --> devem ser mantidas intactas
- Preserve títulos (##) e sua hierarquia
- Seja conciso mas completo

FORMATO DE RESPOSTA:
- Retorne APENAS o artigo melhorado em markdown
- Não adicione explicações, introduções ou comentários sobre o que foi alterado
- Não envolva a resposta em blocos de código`

function buildUserMessage(
  markdownContent: string,
  mode: AiImproveMode,
  customPrompt?: string,
): string {
  if (mode === 'simplify') {
    return `Simplifique este artigo. Torne mais direto e curto, mantendo formatação rica:\n\n${markdownContent}`
  }
  if (mode === 'custom' && customPrompt?.trim()) {
    return `Instrução especial: ${customPrompt.trim()}\n\nAplique a instrução ao artigo abaixo, mantendo formatação rica:\n\n${markdownContent}`
  }
  return `Melhore a apresentação, clareza e formatação deste artigo:\n\n${markdownContent}`
}

async function callBifrost(userMessage: string): Promise<string> {
  const apiKey = decodeBifrostKey()

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      await sleep(RETRY_DELAY_MS * Math.min(attempt, 4))
    }

    let response: Response
    try {
      response = await fetch(BIFROST_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: BIFROST_MODEL,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userMessage },
          ],
          temperature: 0.3,
        }),
      })
    } catch {
      if (attempt < MAX_RETRIES) continue
      throw new Error('Falha de rede ao chamar a IA. Verifique sua conexão.')
    }

    if (response.ok) {
      const data = await response.json() as {
        choices?: Array<{ message?: { content?: string } }>
      }
      const content = data?.choices?.[0]?.message?.content
      if (typeof content !== 'string' || !content.trim()) {
        throw new Error('A IA não retornou conteúdo. Tente novamente.')
      }
      console.log('[Bifrost] Response OK, length:', content.length)
      return content.trim().replace(/^```[\w]*\n?/, '').replace(/\n?```$/, '')
    }

    if (response.status === 401 || response.status === 429) {
      console.warn(`[Bifrost] Rate limited (${response.status}), retry ${attempt + 1}/${MAX_RETRIES + 1}`)
      if (attempt < MAX_RETRIES) continue
      throw new Error('Limite de requisições da IA. Aguarde 30 segundos e tente novamente.')
    }

    const errorText = await response.text().catch(() => '')
    let detail = ''
    try {
      const parsed = JSON.parse(errorText) as { error?: { message?: string } }
      detail = parsed?.error?.message ?? ''
    } catch {
      detail = errorText.slice(0, 200)
    }

    throw new Error(`Erro da IA (${response.status}): ${detail || 'Tente novamente.'}`)
  }

  throw new Error('Não foi possível obter resposta da IA.')
}

export async function improveTipTapContent(
  doc: TipTapDoc,
  mode: AiImproveMode,
  options?: {
    customPrompt?: string
    onProgress?: (progress: AiImproveProgress) => void
  },
): Promise<TipTapDoc> {
  if (isEmptyDoc(doc)) {
    throw new Error('Escreva algum conteúdo antes de pedir melhorias com IA.')
  }

  options?.onProgress?.({
    currentSection: 1,
    totalSections: 1,
    sectionLabel: 'Melhorando texto',
  })

  const markdown = tiptapToMarkdown(doc)
  console.log('[AI] Markdown sent to AI:', markdown.slice(0, 400))

  const userMessage = buildUserMessage(markdown, mode, options?.customPrompt)
  const aiResponse = await callBifrost(userMessage)

  console.log('[AI] Response preview:', aiResponse.slice(0, 400))

  const result = markdownToTiptap(aiResponse)

  if (isEmptyDoc(result)) {
    console.error('[AI] Result is empty! Raw:', aiResponse.slice(0, 500))
    throw new Error('A IA retornou conteúdo vazio. Tente novamente.')
  }

  console.log('[AI] Result nodes:', (result.content as unknown[])?.length)
  return result
}

export async function refineTipTapProposal(
  proposal: TipTapDoc,
  mode: 'simplify' | 'custom',
  options?: {
    customPrompt?: string
    onProgress?: (progress: AiImproveProgress) => void
  },
): Promise<TipTapDoc> {
  return improveTipTapContent(proposal, mode, options)
}

export function getAiErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message || 'Erro desconhecido ao chamar a IA.'
  return 'Não foi possível melhorar o conteúdo. Tente novamente.'
}
