import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return json({ error: 'Função sem credenciais do projeto.' }, 500)
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return json({ error: 'Sessão ausente. Entre novamente.' }, 401)
    }

    const accessToken = authHeader.slice('Bearer '.length).trim()
    const supabaseUser = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const {
      data: { user },
      error: userError,
    } = await supabaseUser.auth.getUser(accessToken)

    if (userError || !user) {
      return json({ error: 'Sessão inválida. Entre novamente.' }, 401)
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.is_active || profile.role !== 'super_admin') {
      return json({ error: 'Apenas um administrador ativo pode redefinir senhas.' }, 403)
    }

    const { userId, password } = await req.json()

    if (!userId || typeof password !== 'string' || password.length < 6) {
      return json({ error: 'Senha inválida. Use no mínimo 6 caracteres.' }, 400)
    }

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password,
    })

    if (updateError) {
      return json({ error: updateError.message }, 400)
    }

    return json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return json({ error: message }, 500)
  }
})
