import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { useAuth } from '@/features/auth/useAuth'
import { isConfigured } from '@/lib/supabase/client'
import { isAuthDisabled } from '@/lib/utils'
import styles from './LoginPage.module.css'

const loginSchema = z.object({
  email: z.email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
})

type LoginForm = z.infer<typeof loginSchema>

export function LoginPage() {
  const { signIn, user, isLoading: authLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/admin/dashboard'

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  if (authLoading) return null
  if (isAuthDisabled() || user) return <Navigate to={from} replace />

  const onSubmit = async (data: LoginForm) => {
    setIsSubmitting(true)
    setError(null)
    const result = await signIn(data.email, data.password)
    setIsSubmitting(false)
    if (result.error) {
      setError(result.error)
      return
    }
    navigate(from, { replace: true })
  }

  return (
    <div className={styles.page}>
      <Card className={styles.card}>
        <div className={styles.brand}>
          <span className={styles.logo}>Loft</span>
          <h1>Painel administrativo</h1>
          <p>Faça login para gerenciar conteúdos</p>
        </div>

        {!isConfigured && (
          <div className={styles.warning}>
            Supabase não configurado. Copie `.env.example` para `.env` e preencha as credenciais.
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          <Input
            label="E-mail"
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />
          <Input
            label="Senha"
            type="password"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register('password')}
          />

          {error && <p className={styles.error}>{error}</p>}

          <Button type="submit" fullWidth isLoading={isSubmitting}>
            Entrar
          </Button>
        </form>
      </Card>
    </div>
  )
}
