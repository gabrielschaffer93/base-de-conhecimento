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
            <Link
              to="/"
              className={isHome ? styles.navLinkActive : undefined}
            >
              Início
            </Link>
            {headerCategories.map((category) => (
              <Link key={category.slug} to={`/categorias/${category.slug}`}>
                {category.label}
              </Link>
            ))}
            <Link
              to="/busca"
              className={isSearch ? styles.navLinkActive : undefined}
            >
              Buscar
            </Link>
          </nav>
          <div className={styles.headerActions}>
            <Link to="/admin/login" className={styles.loginButton}>
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
