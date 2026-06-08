import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import { isAuthDisabled } from '@/lib/utils'
import type { Profile, UserRole } from '@/types/database'
import { AuthContext } from '@/features/auth/AuthContext'

const devProfile: Profile = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'dev@local',
  full_name: 'Dev (auth desativado)',
  avatar_url: null,
  role: 'super_admin',
  is_active: true,
  created_at: new Date(0).toISOString(),
  updated_at: new Date(0).toISOString(),
}

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()
  if (error) return null
  return data
}

async function resolveSession(session: Session | null): Promise<{
  session: Session | null
  user: User | null
  profile: Profile | null
}> {
  const user = session?.user ?? null
  const profile = user ? await fetchProfile(user.id) : null
  return { session, user, profile }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshProfile = useCallback(async () => {
    if (!user) return
    const data = await fetchProfile(user.id)
    setProfile(data)
  }, [user])

  useEffect(() => {
    if (isAuthDisabled()) {
      setProfile(devProfile)
      setIsLoading(false)
      return
    }

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
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      const resolved = await resolveSession(newSession)
      setSession(resolved.session)
      setUser(resolved.user)
      setProfile(resolved.profile)
      setIsLoading(false)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    if (isAuthDisabled()) return { error: null }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: 'E-mail ou senha inválidos.' }
    return { error: null }
  }, [])

  const signOut = useCallback(async () => {
    if (isAuthDisabled()) {
      setProfile(devProfile)
      return
    }
    await supabase.auth.signOut()
    setProfile(null)
  }, [])

  const hasRole = useCallback(
    (...roles: UserRole[]) => {
      if (isAuthDisabled()) return true
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
