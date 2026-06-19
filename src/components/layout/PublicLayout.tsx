import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { BrandLogo } from '@/components/layout/BrandLogo'
import { PublicFooter } from '@/components/layout/PublicFooter'
import { FloatingWhatsAppButton } from '@/components/public/FloatingWhatsAppButton'
import { fetchCategories } from '@/features/categories/categoriesService'
import { resolveHeaderCategories } from '@/features/categories/resolveHeaderCategories'
import type { ResolvedHeaderCategory } from '@/features/categories/resolveHeaderCategories'
import styles from './PublicLayout.module.css'

export function PublicLayout() {
  const location = useLocation()
  const isHome = location.pathname === '/'
  const isSearch = location.pathname === '/busca'
  const [headerCategories, setHeaderCategories] = useState<ResolvedHeaderCategory[]>([])

  const navLinkClass = (active: boolean) =>
    active ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink

  useEffect(() => {
    fetchCategories()
      .then((categories) => setHeaderCategories(resolveHeaderCategories(categories)))
      .catch(() => setHeaderCategories([]))
  }, [])

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <BrandLogo to="/" />
          <nav className={styles.nav} aria-label="Navegação principal">
            <Link to="/" className={navLinkClass(isHome)}>
              Início
            </Link>
            {headerCategories.map((category) => {
              const categoryPath = `/categorias/${category.slug}`
              const isCategoryActive = location.pathname === categoryPath

              return (
                <Link
                  key={category.slug}
                  to={categoryPath}
                  className={navLinkClass(isCategoryActive)}
                >
                  {category.label}
                </Link>
              )
            })}
            <Link to="/busca" className={navLinkClass(isSearch)}>
              Buscar
            </Link>
          </nav>
          <div className={styles.headerActions}>
            <Link to="/admin/login" className={styles.loginButton}>
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={styles.loginIcon}>
                <path
                  d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
                <path
                  d="M6 20v-1a6 6 0 0 1 12 0v1"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
              Entrar
            </Link>
          </div>
        </div>
      </header>

      <main className={isHome ? styles.mainHome : isSearch ? styles.mainSearch : styles.main}>
        <Outlet />
      </main>

      <PublicFooter />
      <FloatingWhatsAppButton />
    </div>
  )
}
