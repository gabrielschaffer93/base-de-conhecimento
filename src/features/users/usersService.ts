import { requestPasswordReset } from '@/features/auth/passwordService'
import { supabase } from '@/lib/supabase/client'
import type { Profile, UserRole } from '@/types/database'

export async function fetchProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
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

function mapInviteUserError(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message

    if (message.includes('already registered') || message.includes('EMAIL_ALREADY_REGISTERED')) {
      return 'Este e-mail já está cadastrado.'
    }
    if (message.includes('NOT_AUTHENTICATED') || message.includes('FORBIDDEN')) {
      return 'Sua sessão expirou ou você não tem permissão. Faça login novamente.'
    }
    if (message.includes('USER_NOT_FOUND') || message.includes('admin_update_invited_profile')) {
      return 'Usuário criado, mas o perfil não foi encontrado. Execute o SQL admin_update_invited_profile no Supabase.'
    }
    if (message.includes('Password')) {
      return 'A senha não atende aos requisitos mínimos de segurança.'
    }
    if (
      message.includes('rate limit') ||
      message.includes('rate_limit') ||
      message.includes('over_email_send_rate_limit') ||
      message.includes('Limite de envio')
    ) {
      return 'Limite de envio de e-mails do Supabase atingido (cerca de 3 por hora no serviço padrão). Aguarde até 1 hora e tente novamente, ou configure SMTP personalizado em Authentication → SMTP no painel do Supabase.'
    }

    return message
  }

  return 'Não foi possível criar o usuário.'
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
