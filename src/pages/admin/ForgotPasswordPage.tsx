import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { getErrorMessage, requestPasswordReset } from '@/features/auth/passwordService'
import styles from './LoginPage.module.css'

const forgotSchema = z.object({
  email: z.email('E-mail inválido'),
})

type ForgotForm = z.infer<typeof forgotSchema>

export function ForgotPasswordPage() {
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema),
  })

  const onSubmit = async (data: ForgotForm) => {
    setIsSubmitting(true)
    setError(null)
    setMessage(null)

    try {
      await requestPasswordReset(data.email)
      setMessage(
        'Se o e-mail estiver cadastrado, enviamos um link para redefinir sua senha. Verifique sua caixa de entrada.',
      )
    } catch (err) {
      setError(getErrorMessage(err, 'Não foi possível enviar o link de redefinição.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={styles.page}>
      <Card className={styles.card}>
        <div className={styles.brand}>
          <span className={styles.logo}>Loft</span>
          <h1>Esqueci minha senha</h1>
          <p>Informe seu e-mail para receber o link de redefinição</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          <Input
            label="E-mail"
            type="email"
            autoComplete="username email"
            error={errors.email?.message}
            {...register('email')}
          />

          {message && <p className={styles.success}>{message}</p>}
          {error && <p className={styles.error}>{error}</p>}

          <Button type="submit" fullWidth isLoading={isSubmitting}>
            Enviar link
          </Button>

          <Link to="/admin/login" className={styles.backLink}>
            Voltar ao login
          </Link>
        </form>
      </Card>
    </div>
  )
}
