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

export async function inviteUser(input: {
  email: string
  password: string
  fullName: string
  role: UserRole
}): Promise<Profile> {
  const {
    data: { session: adminSession },
  } = await supabase.auth.getSession()

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: { full_name: input.fullName },
    },
  })

  if (authError) throw authError
  if (!authData.user) throw new Error('Failed to create user')

  if (adminSession) {
    await supabase.auth.setSession({
      access_token: adminSession.access_token,
      refresh_token: adminSession.refresh_token,
    })
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({
      full_name: input.fullName,
      role: input.role,
      is_active: true,
    })
    .eq('id', authData.user.id)
    .select()
    .single()

  if (error) throw error
  return data
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
