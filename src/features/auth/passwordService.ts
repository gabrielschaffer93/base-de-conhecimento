import { supabase } from '@/lib/supabase/client'

export function getPasswordResetRedirectUrl(): string {
  return `${window.location.origin}/admin/reset-password`
}

export async function requestPasswordReset(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: getPasswordResetRedirectUrl(),
  })
  if (error) throw error
}

export async function updatePasswordAfterRecovery(password: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password })
  if (error) throw error
}

export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message
  return fallback
}
