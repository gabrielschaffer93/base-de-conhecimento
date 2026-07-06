import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const DEPLOY_VERSION = '2026-07-03-v5'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const BIFROST_MODEL = Deno.env.get('BIFROST_MODEL') ?? 'vertex/gemini-2.5-flash'
const BIFROST_TIMEOUT_MS = 55_000
const BIFROST_PING_TIMEOUT_MS = 15_000
const BIFROST_MAX_TOKENS = Number(Deno.env.get('BIFROST_MAX_TOKENS') ?? '1200')

function getBifrostChatUrl(): string {
  const raw = (Deno.env.get('BIFROST_BASE_URL') ?? 'https://proxy.loft.ai/v1').replace(/\/$/, '')
  if (raw.endsWith('/chat/completions')) return raw
  return `${raw}/chat/completions`
}

type ImproveMode = 'improve' | 'simplify' | 'custom'

interface ImproveRequestBody {
  serializedContent: string
  mode: ImproveMode
  customPrompt?: string
  previousOutput?: string
}

const SYSTEM_PROMPT =
  'Edite artigos em português brasileiro. Preserve tags de bloco: [PARAGRAPH], [HEADING], [LIST], [ITEM], [B], [I], [LINK], [IMAGE], [VIDEO], [CALLOUT], [ACCORDION]. Não invente URLs. Mantenha passos 1,2,3 em ordem. Retorne só blocos, sem markdown.'

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'x-improve-content-version': DEPLOY_VERSION,
    },
  })
}

function buildUserPrompt(body: ImproveRequestBody): string {
  const { serializedContent, mode, customPrompt, previousOutput } = body

  if (mode === 'simplify' && previousOutput) {
    return `Simplifique mantendo blocos e mídias:\n${previousOutput}`
  }

  if (mode === 'custom' && customPrompt?.trim()) {
    return `Instrução: ${customPrompt.trim()}\n\n${previousOutput ?? serializedContent}`
  }

  return `Melhore clareza e gramática sem alterar fatos:\n${serializedContent}`
}

function getBifrostHeaders(apiKey: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
  }
}

function getBifrostApiKey(): string {
  const apiKey = Deno.env.get('BIFROST_API_KEY')?.trim()
  if (!apiKey) throw new Error('CONFIG:BIFROST_API_KEY missing')
  return apiKey
}

async function callBifrostRaw(options: {
  userPrompt: string
  systemPrompt?: string
  timeoutMs: number
  maxTokens: number
}): Promise<{ content: string; elapsedMs: number }> {
  const apiKey = getBifrostApiKey()
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), options.timeoutMs)
  const startedAt = Date.now()

  try {
    const response = await fetch(getBifrostChatUrl(), {
      method: 'POST',
      headers: getBifrostHeaders(apiKey),
      body: JSON.stringify({
        model: BIFROST_MODEL,
        messages: [
          { role: 'system', content: options.systemPrompt ?? SYSTEM_PROMPT },
          { role: 'user', content: options.userPrompt },
        ],
        temperature: 0.2,
        max_completion_tokens: options.maxTokens,
      }),
      signal: controller.signal,
    })

    const responseText = await response.text()
    const elapsedMs = Date.now() - startedAt

    if (!response.ok) {
      console.error(`[${DEPLOY_VERSION}] bifrost http ${response.status}`, responseText.slice(0, 400))
      throw new Error(`BIFROST_HTTP_${response.status}:${responseText.slice(0, 200)}`)
    }

    const data = JSON.parse(responseText) as { choices?: Array<{ message?: { content?: string } }> }
    const content = data?.choices?.[0]?.message?.content

    if (typeof content !== 'string' || !content.trim()) {
      throw new Error('BIFROST_EMPTY_CONTENT')
    }

    return { content: content.trim(), elapsedMs }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('BIFROST_TIMEOUT')
    }
    if (error instanceof TypeError) {
      throw new Error('BIFROST_NETWORK')
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

async function callBifrost(userPrompt: string): Promise<string> {
  console.log(
    `[${DEPLOY_VERSION}] bifrost start`,
    JSON.stringify({ model: BIFROST_MODEL, chars: userPrompt.length }),
  )

  const { content, elapsedMs } = await callBifrostRaw({
    userPrompt,
    timeoutMs: BIFROST_TIMEOUT_MS,
    maxTokens: BIFROST_MAX_TOKENS,
  })

  console.log(`[${DEPLOY_VERSION}] bifrost ok`, JSON.stringify({ ms: elapsedMs }))
  return content.replace(/^```[\w]*\n?/, '').replace(/\n?```$/, '')
}

async function pingBifrost(): Promise<Record<string, unknown>> {
  try {
    const { content, elapsedMs } = await callBifrostRaw({
      userPrompt: 'Responda apenas: ok',
      systemPrompt: 'Responda em uma palavra.',
      timeoutMs: BIFROST_PING_TIMEOUT_MS,
      maxTokens: 10,
    })
    return { ok: true, ms: elapsedMs, sample: content.slice(0, 20) }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown'
    return { ok: false, error: message }
  }
}

function mapErrorToUserMessage(message: string): { status: number; error: string } {
  if (message.includes('CONFIG:BIFROST_API_KEY missing')) {
    return { status: 503, error: 'Serviço de IA não configurado (BIFROST_API_KEY).' }
  }
  if (message.includes('CONFIG:BIFROST_API_KEY must start with sk-bf-')) {
    return { status: 503, error: 'BIFROST_API_KEY inválida. Use a virtual key sk-bf-... do time de engenharia.' }
  }
  if (message === 'BIFROST_TIMEOUT') {
    return {
      status: 504,
      error:
        'A Bifrost não respondeu a tempo a partir do Supabase. Teste GET ?ping=bifrost e peça ao time de engenharia liberar egress Supabase → proxy.loft.ai.',
    }
  }
  if (message === 'BIFROST_NETWORK') {
    return {
      status: 502,
      error: 'Edge Function não conseguiu conectar em proxy.loft.ai. Peça liberação de rede ao time de engenharia.',
    }
  }
  if (message.includes('BIFROST_HTTP_401') || message.includes('virtual key')) {
    return { status: 502, error: 'Chave Bifrost rejeitada (401). Gere uma nova virtual key sk-bf-...' }
  }
  if (message.startsWith('BIFROST_HTTP_')) {
    return { status: 502, error: 'Bifrost retornou erro. Veja os logs da Edge Function no Supabase.' }
  }
  if (message === 'BIFROST_EMPTY_CONTENT' || message === 'BIFROST_INVALID_JSON') {
    return { status: 502, error: 'Resposta inválida da Bifrost. Tente novamente.' }
  }
  if (message.includes('Unauthorized') || message.includes('JWT')) {
    return { status: 401, error: 'Sessão expirada. Faça login novamente.' }
  }

  return { status: 500, error: 'Não foi possível processar o conteúdo. Tente novamente.' }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const url = new URL(req.url)

  if (req.method === 'GET') {
    const payload: Record<string, unknown> = {
      ok: true,
      version: DEPLOY_VERSION,
      model: BIFROST_MODEL,
      baseUrl: getBifrostChatUrl().replace(/\/chat\/completions$/, ''),
    }

    if (url.searchParams.get('ping') === 'bifrost') {
      payload.bifrost = await pingBifrost()
    }

    return jsonResponse(payload)
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const authHeader = req.headers.get('Authorization')

    if (!authHeader) {
      return jsonResponse({ error: 'Não autorizado' }, 401)
    }

    const supabaseUser = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const {
      data: { user },
      error: userError,
    } = await supabaseUser.auth.getUser()

    if (userError || !user) {
      return jsonResponse({ error: 'Não autorizado' }, 401)
    }

    const body = (await req.json()) as ImproveRequestBody

    if (!body.serializedContent?.trim()) {
      return jsonResponse({ error: 'Conteúdo vazio' }, 400)
    }

    if (!['improve', 'simplify', 'custom'].includes(body.mode)) {
      return jsonResponse({ error: 'Modo inválido' }, 400)
    }

    const userPrompt = buildUserPrompt(body)
    const improvedContent = await callBifrost(userPrompt)

    return jsonResponse({ improvedContent, version: DEPLOY_VERSION })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown'
    console.error(`[${DEPLOY_VERSION}] improve-content error:`, message)
    const mapped = mapErrorToUserMessage(message)
    return jsonResponse({ error: mapped.error, version: DEPLOY_VERSION }, mapped.status)
  }
})
