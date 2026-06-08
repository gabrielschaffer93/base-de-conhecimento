import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input, Select } from '@/components/ui/Input'
import { PageHeader } from '@/components/ui/PageHeader'
import { Spinner } from '@/components/ui/Spinner'
import { useAuth } from '@/features/auth/useAuth'
import {
  fetchProfiles,
  inviteUser,
  toggleProfileActive,
  updateProfileRole,
} from '@/features/users/usersService'
import type { Profile, UserRole } from '@/types/database'
import styles from './UsersPage.module.css'

export function UsersPage() {
  const { profile: currentProfile } = useAuth()
  const [users, setUsers] = useState<Profile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)
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
    await inviteUser({
      email: inviteForm.email,
      password: inviteForm.password,
      fullName: inviteForm.fullName,
      role: inviteForm.role,
    })
    setShowInvite(false)
    setInviteForm({ email: '', password: '', fullName: '', role: 'editor' })
    reload()
  }

  const handleRoleChange = async (id: string, role: UserRole) => {
    await updateProfileRole(id, role)
    reload()
  }

  const handleToggleActive = async (user: Profile) => {
    if (user.id === currentProfile?.id) {
      alert('Você não pode desativar sua própria conta.')
      return
    }
    await toggleProfileActive(user.id, !user.is_active)
    reload()
  }

  if (isLoading) return <Spinner />

  return (
    <div>
      <PageHeader
        title="Usuários"
        description="Gerencie acessos ao painel administrativo"
        actions={<Button onClick={() => setShowInvite(!showInvite)}>Convidar usuário</Button>}
      />

      {showInvite && (
        <Card className={styles.inviteCard}>
          <form onSubmit={handleInvite} className={styles.inviteForm}>
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
            <Input
              label="Senha temporária"
              type="password"
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
            <Button type="submit">Criar usuário</Button>
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
                <td>{user.is_active ? 'Ativo' : 'Inativo'}</td>
                <td>
                  <Button variant="ghost" size="sm" onClick={() => handleToggleActive(user)}>
                    {user.is_active ? 'Desativar' : 'Ativar'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
