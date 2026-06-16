import { Link } from 'react-router-dom'
import styles from './BrandLogo.module.css'

interface BrandLogoProps {
  to?: string
  asLink?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function BrandLogo({
  to = '/',
  asLink = true,
  size = 'md',
  className = '',
}: BrandLogoProps) {
  if (asLink) {
    return (
      <Link to={to} className={`${styles.link} ${className}`}>
        <img
          src="/loft.png"
          className={`${styles.image} ${styles[size]}`}
        />
      </Link>
    )
  }

  return (
    <div className={`${styles.wrap} ${className}`}>
      <img
        src="/loft.png"
        className={`${styles.image} ${styles[size]}`}
      />
    </div>
  )
}
