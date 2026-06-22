import { requestPasswordReset } from '@/features/auth/passwordService'
import { supabase } from '@/lib/supabase/client'
import type { AdminProfile, Profile, UserRole } from '@/types/database'

export async function fetchProfiles(): Promise<AdminProfile[]> {
  const { data, error } = await supabase.rpc('admin_list_profiles')
  if (error) throw error
  return (data ?? []) as AdminProfile[]
}

export async function updateProfileRole(id: string, role: UserRole): Promise<Profile> {
  const { data, error } = await supabase.from('profiles').update({ role }).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function toggleProfileActive(id: string, isActive: boolean): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ is_active: isActive })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

async function restoreAdminSession(accessToken: string, refreshToken: string): Promise<void> {
  const { error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  })

  if (error) throw error
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message

  if (error && typeof error === 'object') {
    const record = error as {
      message?: string
      error_description?: string
      details?: string
      code?: string
    }

    if (record.message) return record.message
    if (record.error_description) return record.error_description
    if (record.details) return record.details
    if (record.code) return record.code
  }

  return ''
}

function mapInviteUserError(error: unknown): string {
  const message = getErrorMessage(error)

  if (!message) {
    return 'Não foi possível criar o usuário. Verifique os logs em Supabase → Authentication → Logs.'
  }

  if (message.includes('already registered') || message.includes('EMAIL_ALREADY_REGISTERED')) {
    return 'Este e-mail já está cadastrado.'
  }
  if (message.includes('NOT_AUTHENTICATED') || message.includes('FORBIDDEN')) {
    return 'Sua sessão expirou ou você não tem permissão. Faça login novamente como administrador.'
  }
  if (
    message.includes('USER_NOT_FOUND') ||
    message.includes('admin_update_invited_profile') ||
    message.includes('Could not find the function')
  ) {
    return 'Função admin_update_invited_profile não encontrada no Supabase. Execute a migration 20250616110000_admin_update_invited_profile.sql no SQL Editor.'
  }
  if (message.includes('Password') || message.includes('password')) {
    return 'A senha não atende aos requisitos mínimos de segurança do Supabase.'
  }
  if (message.includes('Signups not allowed') || message.includes('signup_disabled')) {
    return 'Cadastro de novos usuários está desabilitado no Supabase. Em Authentication → Providers → Email, habilite "Enable sign up".'
  }
  if (
    message.includes('rate limit') ||
    message.includes('rate_limit') ||
    message.includes('over_email_send_rate_limit') ||
    message.includes('Limite de envio')
  ) {
    return 'Limite de envio de e-mails do Supabase atingido (cerca de 3 por hora no serviço padrão). Aguarde até 1 hora e tente novamente, ou configure SMTP personalizado em Authentication → SMTP no painel do Supabase.'
  }
  if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
    return 'Falha de conexão com o Supabase. Verifique rede/VPN ou se o domínio supabase.co não está bloqueado pelo proxy corporativo.'
  }

  return message
}

export async function inviteUser(input: {
  email: string
  password: string
  fullName: string
  role: UserRole
}): Promise<Profile> {
  const {
    data: { session: adminSession },
  } = await supabase.auth.getSession()

  if (!adminSession) {
    throw new Error('NOT_AUTHENTICATED')
  }

  const adminAccessToken = adminSession.access_token
  const adminRefreshToken = adminSession.refresh_token

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: { full_name: input.fullName },
    },
  })

  if (authError) throw new Error(mapInviteUserError(authError))

  try {
    if (!authData.user) {
      throw new Error('Failed to create user')
    }

    if (authData.user.identities?.length === 0) {
      throw new Error('EMAIL_ALREADY_REGISTERED')
    }

    await restoreAdminSession(adminAccessToken, adminRefreshToken)

    const { data, error } = await supabase.rpc('admin_update_invited_profile', {
      target_user_id: authData.user.id,
      target_full_name: input.fullName,
      target_role: input.role,
    })

    if (error) throw error
    if (!data) throw new Error('USER_NOT_FOUND')

    return data as Profile
  } catch (error) {
    await restoreAdminSession(adminAccessToken, adminRefreshToken).catch(() => undefined)
    throw new Error(mapInviteUserError(error))
  }
}

export async function sendPasswordResetEmail(email: string): Promise<void> {
  await requestPasswordReset(email)
}

export async function adminResetUserPassword(userId: string, password: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke('admin-reset-password', {
    body: { userId, password },
  })

  if (error) throw error
  if (data?.error) throw new Error(data.error)
}
