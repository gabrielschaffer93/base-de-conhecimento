import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { PageHeader } from '@/components/ui/PageHeader'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { useAuth } from '@/features/auth/useAuth'
import { updateOwnProfile, updatePassword, uploadAvatar, getErrorMessage } from '@/features/profile/profileService'
import { getRoleLabel } from '@/lib/utils'
import styles from './ProfilePage.module.css'

export function ProfilePage() {
  const { profile, refreshProfile } = useAuth()
  const [fullName, setFullName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [profileMessage, setProfileMessage] = useState<string | null>(null)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [isSavingPassword, setIsSavingPassword] = useState(false)

  useEffect(() => {
    if (!profile) return
    setFullName(profile.full_name ?? '')
    setAvatarUrl(profile.avatar_url)
  }, [profile])

  if (!profile) return null

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setProfileError('Selecione um arquivo de imagem.')
      e.target.value = ''
      return
    }

    setIsUploadingAvatar(true)
    setProfileError(null)
    setProfileMessage(null)

    try {
      const path = await uploadAvatar(profile.id, file)
      const updated = await updateOwnProfile({ avatarUrl: path })
      setAvatarUrl(updated.avatar_url)
      await refreshProfile()
      setProfileMessage('Foto atualizada com sucesso.')
    } catch (error) {
      setProfileError(getErrorMessage(error, 'Não foi possível enviar a foto.'))
    } finally {
      setIsUploadingAvatar(false)
      e.target.value = ''
    }
  }

  const handleRemoveAvatar = async () => {
    setIsSavingProfile(true)
    setProfileError(null)
    setProfileMessage(null)

    try {
      await updateOwnProfile({ avatarUrl: null })
      setAvatarUrl(null)
      await refreshProfile()
      setProfileMessage('Foto removida.')
    } catch {
      setProfileError('Não foi possível remover a foto.')
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingProfile(true)
    setProfileError(null)
    setProfileMessage(null)

    try {
      await updateOwnProfile({ fullName: fullName.trim() })
      await refreshProfile()
      setProfileMessage('Perfil atualizado com sucesso.')
    } catch {
      setProfileError('Não foi possível salvar o perfil.')
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError(null)
    setPasswordMessage(null)

    if (newPassword.length < 6) {
      setPasswordError('A nova senha deve ter no mínimo 6 caracteres.')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('As senhas não coincidem.')
      return
    }

    setIsSavingPassword(true)

    try {
      await updatePassword(newPassword)
      setNewPassword('')
      setConfirmPassword('')
      setPasswordMessage('Senha alterada com sucesso.')
    } catch {
      setPasswordError('Não foi possível alterar a senha.')
    } finally {
      setIsSavingPassword(false)
    }
  }

  return (
    <div className={styles.page}>
      <PageHeader title="Meu perfil" description="Gerencie suas informações pessoais e senha de acesso" />

      <Card>
        <div className={styles.avatarSection}>
          <UserAvatar
            name={fullName || profile.full_name}
            email={profile.email}
            avatarUrl={avatarUrl}
            size="lg"
          />
          <div className={styles.avatarActions}>
            <label className={styles.uploadBtn}>
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={handleAvatarChange}
                disabled={isUploadingAvatar}
              />
              <span className={styles.uploadLabel}>
                {isUploadingAvatar ? 'Enviando…' : 'Alterar foto'}
              </span>
            </label>
            {avatarUrl && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemoveAvatar}
                disabled={isSavingProfile}
              >
                Remover foto
              </Button>
            )}
            <p className={styles.avatarHint}>JPG, PNG ou WebP. Recomendado: 256×256 px.</p>
          </div>
        </div>
      </Card>

      <Card>
        <form onSubmit={handleSaveProfile} className={styles.form}>
          <Input
            label="Nome completo"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <div className={styles.readOnlyField}>
            <span className={styles.readOnlyLabel}>E-mail</span>
            <span className={styles.readOnlyValue}>{profile.email}</span>
          </div>
          <div className={styles.readOnlyField}>
            <span className={styles.readOnlyLabel}>Acesso</span>
            <span className={styles.readOnlyValue}>{getRoleLabel(profile.role)}</span>
          </div>

          {profileMessage && <p className={styles.success}>{profileMessage}</p>}
          {profileError && <p className={styles.error}>{profileError}</p>}

          <div className={styles.actions}>
            <Button type="submit" isLoading={isSavingProfile}>
              Salvar alterações
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <h2 className={styles.sectionTitle}>Alterar senha</h2>
        <p className={styles.sectionDescription}>Use uma senha forte com pelo menos 6 caracteres.</p>

        <form onSubmit={handleChangePassword} className={styles.form}>
          <PasswordInput
            label="Nova senha"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <PasswordInput
            label="Confirmar nova senha"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          {passwordMessage && <p className={styles.success}>{passwordMessage}</p>}
          {passwordError && <p className={styles.error}>{passwordError}</p>}

          <div className={styles.actions}>
            <Button type="submit" variant="secondary" isLoading={isSavingPassword}>
              Atualizar senha
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
