import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import type { Profile, UserRole } from '@/types/database'
import { AuthContext } from '@/features/auth/AuthContext'

async function loadProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (!error && data) return data

  const { data: ensured, error: ensureError } = await supabase.rpc('ensure_user_profile')
  if (ensureError || !ensured) return null
  return ensured as Profile
}

async function resolveSession(session: Session | null) {
  const user = session?.user ?? null
  const profile = user ? await loadProfile(user.id) : null
  return { session, user, profile }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshProfile = useCallback(async () => {
    if (!user) return
    const data = await loadProfile(user.id)
    setProfile(data)
  }, [user])

  useEffect(() => {
    let isMounted = true

    supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
      if (!isMounted) return
      const resolved = await resolveSession(currentSession)
      setSession(resolved.session)
      setUser(resolved.user)
      setProfile(resolved.profile)
      setIsLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      window.setTimeout(async () => {
        if (!isMounted) return
        const resolved = await resolveSession(newSession)
        setSession(resolved.session)
        setUser(resolved.user)
        setProfile(resolved.profile)
        setIsLoading(false)
      }, 0)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: 'E-mail ou senha inválidos.' }
    if (!data.session || !data.user) return { error: 'E-mail ou senha inválidos.' }

    const resolved = await resolveSession(data.session)
    setSession(resolved.session)
    setUser(resolved.user)
    setProfile(resolved.profile)

    if (!resolved.profile) {
      return { error: 'Perfil não encontrado. Contate o administrador.' }
    }
    if (!resolved.profile.is_active) {
      return { error: 'Seu perfil está inativo. Contate o administrador.' }
    }

    return { error: null }
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setSession(null)
    setUser(null)
    setProfile(null)
  }, [])

  const hasRole = useCallback(
    (...roles: UserRole[]) => {
      if (!profile?.is_active) return false
      return roles.includes(profile.role)
    },
    [profile],
  )

  const value = useMemo(
    () => ({
      user,
      profile,
      session,
      isLoading,
      signIn,
      signOut,
      hasRole,
      refreshProfile,
    }),
    [user, profile, session, isLoading, signIn, signOut, hasRole, refreshProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
