import { Link } from 'react-router-dom'
import styles from './PublicFooter.module.css'

const PLATFORM_LINKS = [
  { label: 'Soluções', to: '/categorias' },
  { label: 'Metodologia', to: '/busca' },
  { label: 'Recursos', to: '/categorias' },
  { label: 'Preços', to: '/busca' },
] as const

const SUPPORT_LINKS = [
  { label: 'Privacidade', to: '/busca' },
  { label: 'Termos de Uso', to: '/busca' },
  { label: 'Contato', to: '/busca' },
  { label: 'Sobre Nós', to: '/' },
] as const

export function PublicFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brandColumn}>
          <Link to="/" className={styles.brandName}>
            Loft
          </Link>
          <p>
            A plataforma definitiva para editoriais de alta performance que buscam excelência e
            dados precisos.
          </p>
          <p className={styles.copyright}>
            © {new Date().getFullYear()} Loft. Todos os direitos reservados.
          </p>
        </div>

        <div className={styles.linksColumn}>
          <h3>Plataforma</h3>
          {PLATFORM_LINKS.map((link) => (
            <Link key={link.label} to={link.to}>
              {link.label}
            </Link>
          ))}
        </div>

        <div className={styles.linksColumn}>
          <h3>Suporte</h3>
          {SUPPORT_LINKS.map((link) => (
            <Link key={link.label} to={link.to}>
              {link.label}
            </Link>
          ))}
        </div>

        <div className={styles.newsletterColumn}>
          <h3>Fique por dentro</h3>
          <p>Receba atualizações do sistema e dicas editoriais.</p>
          <form className={styles.newsletterForm} onSubmit={(event) => event.preventDefault()}>
            <label htmlFor="newsletter-email" className="sr-only">
              E-mail
            </label>
            <input
              id="newsletter-email"
              type="email"
              placeholder="Seu e-mail"
              className={styles.newsletterInput}
            />
            <button type="submit" className={styles.newsletterButton} aria-label="Inscrever-se">
              →
            </button>
          </form>
        </div>
      </div>
    </footer>
  )
}
