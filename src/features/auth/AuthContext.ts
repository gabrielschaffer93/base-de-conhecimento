import { createContext } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import type { Profile, UserRole } from '@/types/database'

export interface AuthContextValue {
  user: User | null
  profile: Profile | null
  session: Session | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  hasRole: (...roles: UserRole[]) => boolean
  refreshProfile: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
