import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input, Select } from '@/components/ui/Input'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { PageHeader } from '@/components/ui/PageHeader'
import { Spinner } from '@/components/ui/Spinner'
import { useAuth } from '@/features/auth/useAuth'
import {
  adminResetUserPassword,
  fetchProfiles,
  inviteUser,
  sendPasswordResetEmail,
  toggleProfileActive,
  updateProfileRole,
} from '@/features/users/usersService'
import type { AdminProfile, UserRole } from '@/types/database'
import { formatDate } from '@/lib/utils'
import styles from './UsersPage.module.css'

export function UsersPage() {
  const { profile: currentProfile } = useAuth()
  const [users, setUsers] = useState<AdminProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [invitedUserEmail, setInvitedUserEmail] = useState<string | null>(null)
  const [isInviting, setIsInviting] = useState(false)
  const [resetUser, setResetUser] = useState<AdminProfile | null>(null)
  const [resetPassword, setResetPassword] = useState('')
  const [resetConfirmPassword, setResetConfirmPassword] = useState('')
  const [resetError, setResetError] = useState<string | null>(null)
  const [resetMessage, setResetMessage] = useState<string | null>(null)
  const [isResettingPassword, setIsResettingPassword] = useState(false)
  const [isSendingLink, setIsSendingLink] = useState(false)
  const [inviteForm, setInviteForm] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'editor' as UserRole,
  })

  const reload = () => {
    setIsLoading(true)
    fetchProfiles()
      .then(setUsers)
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    fetchProfiles()
      .then(setUsers)
      .finally(() => setIsLoading(false))
  }, [])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviteError(null)
    setIsInviting(true)
    try {
      const invitedEmail = inviteForm.email
      await inviteUser({
        email: inviteForm.email,
        password: inviteForm.password,
        fullName: inviteForm.fullName,
        role: inviteForm.role,
      })
      setShowInvite(false)
      setInviteForm({ email: '', password: '', fullName: '', role: 'editor' })
      setInvitedUserEmail(invitedEmail)
      reload()
    } catch (error) {
      setInviteError(error instanceof Error ? error.message : 'Não foi possível criar o usuário.')
    } finally {
      setIsInviting(false)
    }
  }

  const handleRoleChange = async (id: string, role: UserRole) => {
    await updateProfileRole(id, role)
    reload()
  }

  const handleToggleActive = async (user: AdminProfile) => {
    if (user.id === currentProfile?.id) {
      alert('Você não pode desativar sua própria conta.')
      return
    }
    await toggleProfileActive(user.id, !user.is_active)
    reload()
  }

  const openResetModal = (user: AdminProfile) => {
    setResetUser(user)
    setResetPassword('')
    setResetConfirmPassword('')
    setResetError(null)
    setResetMessage(null)
  }

  const closeResetModal = () => {
    setResetUser(null)
    setResetPassword('')
    setResetConfirmPassword('')
    setResetError(null)
    setResetMessage(null)
  }

  const handleAdminResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resetUser) return

    setResetError(null)
    setResetMessage(null)

    if (resetPassword.length < 6) {
      setResetError('A senha deve ter no mínimo 6 caracteres.')
      return
    }

    if (resetPassword !== resetConfirmPassword) {
      setResetError('As senhas não coincidem.')
      return
    }

    setIsResettingPassword(true)
    try {
      await adminResetUserPassword(resetUser.id, resetPassword)
      setResetMessage(`Senha de ${resetUser.email} redefinida. Informe a nova senha ao usuário.`)
      setResetPassword('')
      setResetConfirmPassword('')
    } catch {
      setResetError('Não foi possível redefinir a senha. Verifique se a Edge Function está publicada.')
    } finally {
      setIsResettingPassword(false)
    }
  }

  const handleSendResetLink = async () => {
    if (!resetUser) return

    setResetError(null)
    setResetMessage(null)
    setIsSendingLink(true)

    try {
      await sendPasswordResetEmail(resetUser.email)
      setResetMessage(`Link de redefinição enviado para ${resetUser.email}.`)
    } catch {
      setResetError('Não foi possível enviar o link de redefinição.')
    } finally {
      setIsSendingLink(false)
    }
  }

  if (isLoading) return <Spinner />

  return (
    <div>
      <PageHeader
        title="Usuários internos"
        description="Gerencie quem pode acessar o painel administrativo"
        actions={
          <Button onClick={() => setShowInvite(!showInvite)}>
            {showInvite ? 'Cancelar' : 'Novo usuário'}
          </Button>
        }
      />

      {showInvite && (
        <Card className={styles.inviteCard}>
          <p className={styles.inviteHint}>
            Crie contas internas da Loft. O usuário receberá um e-mail de confirmação antes de poder entrar.
          </p>
          <p className={styles.inviteEmailLimitNotice} role="status">
            No plano gratuito do Banco de dados, o envio de e-mails de confirmação é limitado a cerca de 3 por hora.
            Se o limite for atingido, aguarde até 1 hora antes de tentar novamente.
          </p>
          <form onSubmit={handleInvite} className={styles.inviteForm}>
            <div className={styles.inviteFormFields}>
              <Input
                label="Nome completo"
                value={inviteForm.fullName}
                onChange={(e) => setInviteForm({ ...inviteForm, fullName: e.target.value })}
              />
              <Input
                label="E-mail"
                type="email"
                value={inviteForm.email}
                onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
              />
              <PasswordInput
                label="Senha temporária"
                value={inviteForm.password}
                onChange={(e) => setInviteForm({ ...inviteForm, password: e.target.value })}
              />
              <Select
                label="Papel"
                value={inviteForm.role}
                onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value as UserRole })}
                options={[
                  { value: 'editor', label: 'Editor' },
                  { value: 'viewer', label: 'Visualizador' },
                  { value: 'super_admin', label: 'Administrador' },
                ]}
              />
            </div>
            <div className={styles.inviteFormActions}>
              {inviteError && (
                <p className={styles.inviteError} role="alert">
                  {inviteError}
                </p>
              )}
              <Button type="submit" isLoading={isInviting}>
                Criar usuário
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nome</th>
              <th>E-mail</th>
              <th>Papel</th>
              <th>E-mail confirmado</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.full_name ?? '—'}</td>
                <td>{user.email}</td>
                <td>
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                    disabled={user.id === currentProfile?.id}
                    className={styles.select}
                  >
                    <option value="super_admin">Administrador</option>
                    <option value="editor">Editor</option>
                    <option value="viewer">Visualizador</option>
                  </select>
                </td>
                <td>
                  {user.email_confirmed_at ? (
                    <span
                      className={`${styles.emailStatus} ${styles.emailStatusConfirmed}`}
                      title={`Confirmado em ${formatDate(user.email_confirmed_at)}`}
                    >
                      Confirmado
                    </span>
                  ) : (
                    <span className={`${styles.emailStatus} ${styles.emailStatusPending}`}>
                      Pendente
                    </span>
                  )}
                </td>
                <td>{user.is_active ? 'Ativo' : 'Inativo'}</td>
                <td className={styles.actionsCell}>
                  <Button variant="ghost" size="sm" onClick={() => openResetModal(user)}>
                    Redefinir senha
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleToggleActive(user)}>
                    {user.is_active ? 'Desativar' : 'Ativar'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {invitedUserEmail && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-labelledby="invite-success-title">
          <div className={styles.modal}>
            <Card>
              <h2 id="invite-success-title" className={styles.modalTitle}>
                Usuário criado com sucesso
              </h2>
              <p className={styles.modalDescription}>
                O usuário <strong>{invitedUserEmail}</strong> receberá um e-mail de confirmação antes de
                poder acessar o painel.
              </p>

              <div className={styles.confirmEmailGuide}>
                <p className={styles.confirmEmailGuideTitle}>O que o usuário deve fazer:</p>
                <ol className={styles.confirmEmailSteps}>
                  <li>Abrir o e-mail com o assunto:</li>
                </ol>
                <p className={styles.emailSubjectPreview}>
                  Supabase Auth - Confirm your email address
                </p>
                <ol className={styles.confirmEmailSteps} start={2}>
                  <li>Clicar no link azul:</li>
                </ol>
                <p className={styles.emailLinkPreview}>Confirm email address</p>
                <p className={styles.confirmEmailNote}>
                  Após confirmar, ele poderá fazer login com o e-mail e a senha definidos aqui.
                </p>
              </div>

              <div className={styles.modalActions}>
                <Button type="button" onClick={() => setInvitedUserEmail(null)}>
                  Fechar
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {resetUser && (
        <div className={styles.modalOverlay} onClick={closeResetModal} role="presentation">
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <Card>
              <h2 className={styles.modalTitle}>Redefinir senha</h2>
              <p className={styles.modalDescription}>
                Usuário: <strong>{resetUser.full_name || resetUser.email}</strong>
              </p>

              <form onSubmit={handleAdminResetPassword} className={styles.resetForm}>
                <PasswordInput
                  label="Nova senha temporária"
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                />
                <PasswordInput
                  label="Confirmar nova senha"
                  value={resetConfirmPassword}
                  onChange={(e) => setResetConfirmPassword(e.target.value)}
                />

                {resetMessage && <p className={styles.resetSuccess}>{resetMessage}</p>}
                {resetError && <p className={styles.resetError}>{resetError}</p>}

                <div className={styles.modalActions}>
                  <Button type="submit" isLoading={isResettingPassword}>
                    Definir nova senha
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleSendResetLink}
                    isLoading={isSendingLink}
                  >
                    Enviar link por e-mail
                  </Button>
                  <Button type="button" variant="ghost" onClick={closeResetModal}>
                    Fechar
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
