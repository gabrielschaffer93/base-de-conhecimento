import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { Spinner } from '@/components/ui/Spinner'
import {
  getErrorMessage,
  updatePasswordAfterRecovery,
} from '@/features/auth/passwordService'
import { supabase } from '@/lib/supabase/client'
import { BrandLogo } from '@/components/layout/BrandLogo'
import styles from './LoginPage.module.css'

type ResetStatus = 'loading' | 'ready' | 'invalid'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<ResetStatus>('loading')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    let isMounted = true

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return
      if (event === 'PASSWORD_RECOVERY' || session) {
        setStatus('ready')
      }
    })

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return
      if (session) setStatus('ready')
    })

    const timeout = window.setTimeout(() => {
      if (!isMounted) return
      setStatus((current) => (current === 'loading' ? 'invalid' : current))
    }, 4000)

    return () => {
      isMounted = false
      subscription.unsubscribe()
      window.clearTimeout(timeout)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }

    setIsSubmitting(true)

    try {
      await updatePasswordAfterRecovery(password)
      await supabase.auth.signOut()
      navigate('/admin/login', {
        replace: true,
        state: { message: 'Senha redefinida com sucesso. Faça login com a nova senha.' },
      })
    } catch (err) {
      setError(getErrorMessage(err, 'Não foi possível redefinir a senha.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className={styles.page}>
        <Card className={styles.card}>
          <Spinner label="Validando link" />
        </Card>
      </div>
    )
  }

  if (status === 'invalid') {
    return (
      <div className={styles.page}>
        <Card className={styles.card}>
          <div className={styles.brand}>
            <h1>Link inválido</h1>
            <p className={styles.hint}>
              Este link expirou ou já foi usado.{' '}
              <Link to="/admin/forgot-password" className={styles.inlineLink}>
                Solicite um novo
              </Link>
              .
            </p>
          </div>
          <Link to="/admin/login" className={styles.backLink}>
            Voltar ao login
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <Card className={styles.card}>
        <div className={styles.brand}>
          <BrandLogo asLink={false} size="lg" className={styles.brandLogo} />
          <h1>Nova senha</h1>
          <p>Defina uma nova senha para acessar o painel</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <PasswordInput
            label="Nova senha"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <PasswordInput
            label="Confirmar nova senha"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          {error && <p className={styles.error}>{error}</p>}

          <Button type="submit" fullWidth isLoading={isSubmitting}>
            Salvar nova senha
          </Button>

          <Link to="/admin/login" className={styles.backLink}>
            Voltar ao login
          </Link>
        </form>
      </Card>
    </div>
  )
}
