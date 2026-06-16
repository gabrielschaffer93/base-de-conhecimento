import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { useAuth } from '@/features/auth/useAuth'
import { storeBrowserPassword } from '@/lib/browserCredentials'
import { isConfigured } from '@/lib/supabase/client'
import { BrandLogo } from '@/components/layout/BrandLogo'
import styles from './LoginPage.module.css'

const loginSchema = z.object({
  username: z.email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
})

type LoginForm = z.infer<typeof loginSchema>

export function LoginPage() {
  const { signIn, user, profile, isLoading: authLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const successMessage = (location.state as { message?: string })?.message

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/admin/dashboard'

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  if (authLoading) return <Spinner label="Verificando sessão" />
  if (user && profile?.is_active) return <Navigate to={from} replace />

  const onSubmit = async (data: LoginForm) => {
    setIsSubmitting(true)
    setError(null)
    const result = await signIn(data.username, data.password)
    setIsSubmitting(false)
    if (result.error) {
      setError(result.error)
      return
    }

    await storeBrowserPassword(data.username, data.password)
    navigate(from, { replace: true })
  }

  return (
    <div className={styles.page}>
      <Card className={styles.card}>
        <div className={styles.brand}>
          <BrandLogo asLink={false} size="lg" className={styles.brandLogo} />
          <h1>Painel administrativo</h1>
          <p>Faça login para gerenciar conteúdos</p>
        </div>

        {!isConfigured && (
          <div className={styles.warning}>
            Supabase não configurado. Preencha as credenciais no arquivo `.env`.
          </div>
        )}

        <form
          name="login"
          method="post"
          action="/admin/login"
          onSubmit={handleSubmit(onSubmit)}
          className={styles.form}
          autoComplete="on"
        >
          <Input
            label="E-mail"
            type="email"
            id="username"
            autoComplete="username email"
            inputMode="email"
            spellCheck={false}
            error={errors.username?.message}
            {...register('username')}
          />
          <PasswordInput
            label="Senha"
            id="password"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register('password')}
          />

          {successMessage && <p className={styles.success}>{successMessage}</p>}
          {error && <p className={styles.error}>{error}</p>}

          <Button type="submit" fullWidth isLoading={isSubmitting}>
            Entrar
          </Button>

          <Link to="/admin/forgot-password" className={styles.forgotLink}>
            Esqueci minha senha
          </Link>
        </form>
      </Card>
    </div>
  )
}
