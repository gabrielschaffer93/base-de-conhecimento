import { BrandLogo } from '@/components/layout/BrandLogo'
import {
  PUBLIC_APP_STORE_URL,
  PUBLIC_BUSINESS_HOURS,
  PUBLIC_FIANCA_NEGOTIATION_URL,
  PUBLIC_FOOTER_ADDRESS,
  PUBLIC_FOOTER_DESCRIPTION,
  PUBLIC_FOOTER_EMAILS,
  PUBLIC_GOOGLE_PLAY_URL,
  PUBLIC_NEGOTIATION_PHONE,
  PUBLIC_NEGOTIATION_PHONE_HREF,
  PUBLIC_SOCIAL_LINKS,
  PUBLIC_SUPPORT_PHONE,
  PUBLIC_SUPPORT_PHONE_HREF,
} from '@/config/publicSite'
import styles from './PublicFooter.module.css'

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" />
    </svg>
  )
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M6.5 8.5h3v10h-3v-10Zm1.5-4.5a1.75 1.75 0 1 1 0 3.5 1.75 1.75 0 0 1 0-3.5ZM10 8.5h2.9v1.36h.04c.4-.76 1.38-1.56 2.84-1.56 3.04 0 3.6 2 3.6 4.6v5.6h-3v-5c0-1.2-.02-2.74-1.67-2.74-1.67 0-1.93 1.3-1.93 2.65v5.09H10V8.5Z" />
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M14 8.5h2.5l-.35 2.75H14v8.25h-3V11.25H9V8.5h2V6.55C11 4.35 12.2 3 14.65 3H17v2.75h-1.55c-.9 0-.95.35-.95 1v1.75Z" />
    </svg>
  )
}

const SOCIAL_ICONS = {
  Instagram: InstagramIcon,
  LinkedIn: LinkedInIcon,
  Facebook: FacebookIcon,
} as const

export function PublicFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brandColumn}>
          <BrandLogo size="lg" className={styles.logo} />

          <p className={styles.description}>{PUBLIC_FOOTER_DESCRIPTION}</p>

          <div className={styles.addressBlock}>
            <span className={styles.sectionLabel}>Endereço</span>
            <p>{PUBLIC_FOOTER_ADDRESS}</p>
          </div>

          <div className={styles.socialRow}>
            {PUBLIC_SOCIAL_LINKS.map((social) => {
              const Icon = SOCIAL_ICONS[social.label]
              return (
                <a
                  key={social.label}
                  href={social.href}
                  className={styles.socialLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                >
                  <Icon />
                </a>
              )
            })}
          </div>

          <div className={styles.appSection}>
            <h3 className={styles.appTitle}>Baixe nosso app</h3>
            <div className={styles.appBadges}>
              <a
                href={PUBLIC_GOOGLE_PLAY_URL}
                className={styles.appBadge}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className={styles.appBadgeIcon} aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M4.5 3.2 13.8 12 4.5 20.8a1.1 1.1 0 0 1-.7-1V4.2c0-.4.3-.8.7-1Z" />
                    <path d="m16.2 10.2 2.5-1.4c.5-.3.5-.9 0-1.2l-2.5-1.4-2.8 2.8 2.8 2.8Z" />
                    <path d="M16.2 13.8 13.4 16.6l2.5 1.4c.5.3 1.1 0 1.1-.6V14.4c0-.3-.2-.6-.5-.6h-.3Z" />
                    <path d="M7.8 12 4.5 8.7v6.6L7.8 12Z" />
                  </svg>
                </span>
                <span className={styles.appBadgeText}>
                  <span className={styles.appBadgeEyebrow}>Disponível no</span>
                  <span className={styles.appBadgeName}>Google Play</span>
                </span>
              </a>

              <a
                href={PUBLIC_APP_STORE_URL}
                className={styles.appBadge}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className={styles.appBadgeIcon} aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16.8 12.6c.02-2.14 1.74-3.17 1.82-3.22-1-.46-2.42-.78-3.45-.8-1.47-.15-2.88.87-3.63.87-.76 0-1.92-.85-3.16-.83-1.62.03-3.12.94-3.95 2.39-1.69 2.93-.43 7.27 1.21 9.65.8 1.16 1.76 2.46 3.02 2.41 1.21-.05 1.67-.78 3.13-.78 1.46 0 1.87.78 3.15.76 1.3-.02 2.13-1.18 2.92-2.35.92-1.35 1.3-2.66 1.32-2.72-.03-.01-2.53-.97-2.55-3.86Z" />
                    <path d="M14.96 5.34c.66-.8 1.1-1.91 0.98-3.02-.95.04-2.1.63-2.78 1.43-.61.71-1.15 1.85-.95 2.94 1.01.08 2.04-.51 2.75-1.35Z" />
                  </svg>
                </span>
                <span className={styles.appBadgeText}>
                  <span className={styles.appBadgeEyebrow}>Baixar na</span>
                  <span className={styles.appBadgeName}>App Store</span>
                </span>
              </a>
            </div>
          </div>
        </div>

        <div className={styles.contactColumn}>
          <span className={styles.sectionLabel}>Fale Conosco</span>

          <div className={styles.contactBlock}>
            <p className={styles.contactHeading}>Atendimento para dúvidas gerais</p>
            <p className={styles.contactText}>
              Telefone e WhatsApp:{' '}
              <a href={PUBLIC_SUPPORT_PHONE_HREF} className={styles.contactLink}>
                {PUBLIC_SUPPORT_PHONE}
              </a>
            </p>
            <p className={styles.contactMetaText}>{PUBLIC_BUSINESS_HOURS}</p>
          </div>

          <div className={styles.contactBlock}>
            <p className={styles.contactHeading}>Negociação de taxa ou aluguel em atraso</p>
            <p className={styles.contactText}>
              <a
                href={PUBLIC_FIANCA_NEGOTIATION_URL}
                className={styles.contactLinkAccent}
                target="_blank"
                rel="noopener noreferrer"
              >
                Acessar área logada
              </a>
            </p>
            <p className={styles.contactText}>
              ou pelo telefone{' '}
              <a href={PUBLIC_NEGOTIATION_PHONE_HREF} className={styles.contactLink}>
                {PUBLIC_NEGOTIATION_PHONE}
              </a>
            </p>
            <p className={styles.contactMetaText}>{PUBLIC_BUSINESS_HOURS}</p>
          </div>
        </div>

        <div className={styles.emailColumn}>
          <span className={styles.sectionLabel}>E-mails</span>

          <ul className={styles.emailList}>
            {PUBLIC_FOOTER_EMAILS.map((email) => (
              <li key={email.address} className={styles.emailItem}>
                <a href={`mailto:${email.address}`} className={styles.contactLink}>
                  {email.address}
                </a>
                <p className={styles.contactMetaText}>{email.description}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className={styles.bottomBar}>
        <p>© {new Date().getFullYear()} Loft. Todos os direitos reservados.</p>
      </div>
    </footer>
  )
}
