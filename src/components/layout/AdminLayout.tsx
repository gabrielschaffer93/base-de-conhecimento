import { useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/useAuth'
import { Button } from '@/components/ui/Button'
import styles from './AdminLayout.module.css'

const navItems = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/admin/posts', label: 'Posts', icon: '📝' },
  { path: '/admin/categories', label: 'Categorias', icon: '📁' },
  { path: '/admin/tags', label: 'Tags', icon: '🏷️' },
  { path: '/admin/media', label: 'Mídia', icon: '🖼️' },
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
          <Link to="/admin/dashboard" className={styles.brand}>
            Loft Admin
          </Link>
        </div>

        <nav className={styles.sidebarNav} aria-label="Menu administrativo">
          {filteredNav.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`${styles.navItem} ${location.pathname.startsWith(item.path) ? styles.navItemActive : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <Link to="/" className={styles.publicLink}>
            Ver site público
          </Link>
        </div>
      </aside>

      <div className={styles.content}>
        <header className={styles.header}>
          <div className={styles.headerUser}>
            <div>
              <strong>{profile?.full_name ?? profile?.email}</strong>
              <span className={styles.role}>{profile?.role}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              Sair
            </Button>
          </div>
        </header>

        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
