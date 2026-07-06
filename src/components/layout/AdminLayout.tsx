import { useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { BrandLogo } from '@/components/layout/BrandLogo'
import { useAuth } from '@/features/auth/useAuth'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { getRoleLabel, getShortDisplayName } from '@/lib/utils'
import styles from './AdminLayout.module.css'

function LogoutIcon() {
  return (
    <svg className={styles.logoutIcon} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M10 7V6a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2v-1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M14 12H4m0 0 3-3m-3 3 3 3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ExternalLinkIcon() {
  return (
    <svg className={styles.publicSiteIcon} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M14 5h5v5M10 14 19 5M18 13v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const navItems = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/admin/posts', label: 'Posts', icon: '📝' },
  { path: '/admin/drafts', label: 'Rascunhos', icon: '📋' },
  { path: '/admin/categories', label: 'Categorias', icon: '📁' },
  { path: '/admin/tags', label: 'Tags', icon: '🏷️' },
  { path: '/admin/media', label: 'Mídia', icon: '🖼️' },
  { path: '/admin/feedback', label: 'Feedback', icon: '💬' },
  { path: '/admin/users', label: 'Usuários', icon: '👥', adminOnly: true },
]

export function AdminLayout() {
  const { profile, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/admin/login')
  }

  const filteredNav = navItems.filter(
    (item) => !item.adminOnly || profile?.role === 'super_admin',
  )

  const isNavItemActive = (path: string) => {
    if (path === '/admin/posts') {
      return location.pathname === '/admin/posts' || location.pathname.startsWith('/admin/posts/')
    }

    if (path === '/admin/drafts') {
      return location.pathname === '/admin/drafts' || location.pathname.startsWith('/admin/drafts/')
    }

    return location.pathname === path || location.pathname.startsWith(`${path}/`)
  }

  return (
    <div className={styles.layout}>
      <button
        type="button"
        className={styles.menuToggle}
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Abrir menu"
      >
        ☰
      </button>

      {sidebarOpen && (
        <button
          type="button"
          className={styles.overlay}
          onClick={() => setSidebarOpen(false)}
          aria-label="Fechar menu"
        />
      )}

      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          <BrandLogo to="/admin/dashboard" size="lg" />
        </div>

        <nav className={styles.sidebarNav} aria-label="Menu administrativo">
          {filteredNav.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`${styles.navItem} ${isNavItemActive(item.path) ? styles.navItemActive : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <Link to="/" className={styles.publicSiteBtn} onClick={() => setSidebarOpen(false)}>
            <ExternalLinkIcon />
            Ver site público
          </Link>

          <div className={styles.userSection}>
            <Link
              to="/admin/profile"
              className={`${styles.profileLink} ${location.pathname === '/admin/profile' ? styles.profileLinkActive : ''}`}
              onClick={() => setSidebarOpen(false)}
              aria-label="Abrir meu perfil"
            >
              <UserAvatar
                name={profile?.full_name}
                email={profile?.email}
                avatarUrl={profile?.avatar_url}
                size="sm"
                className={styles.profileAvatar}
              />
              <div className={styles.profileInfo}>
                <strong>{getShortDisplayName(profile?.full_name, profile?.email)}</strong>
                <span className={styles.role}>
                  {profile ? getRoleLabel(profile.role) : ''}
                </span>
              </div>
            </Link>
            <button
              type="button"
              className={styles.logoutBtn}
              onClick={() => void handleSignOut()}
              aria-label="Sair"
              title="Sair"
            >
              <LogoutIcon />
            </button>
          </div>
        </div>
      </aside>

      <div className={styles.content}>
        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
