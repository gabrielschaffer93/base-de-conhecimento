import { Link, Outlet } from 'react-router-dom'
import { BrandLogo } from '@/components/layout/BrandLogo'
import styles from './PublicLayout.module.css'

export function PublicLayout() {
  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <BrandLogo to="/" />
          <nav className={styles.nav} aria-label="Navegação principal">
            <Link to="/">Início</Link>
            <Link to="/busca">Buscar</Link>
            <Link to="/admin/login" className={styles.adminLink}>
              Painel
            </Link>
          </nav>
        </div>
      </header>

      <main className={styles.main}>
        <Outlet />
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <p>© {new Date().getFullYear()} Loft. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
