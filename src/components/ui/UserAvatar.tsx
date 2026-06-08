import { useEffect, useState } from 'react'
import { getAvatarDisplayUrl, getAvatarSignedUrl } from '@/features/profile/profileService'
import styles from './UserAvatar.module.css'

interface UserAvatarProps {
  name?: string | null
  email?: string | null
  avatarUrl?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

function getInitials(name?: string | null, email?: string | null): string {
  const source = name?.trim() || email?.trim() || '?'
  const parts = source.split(/\s+/).filter(Boolean)

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
  }

  return source.slice(0, 2).toUpperCase()
}

export function UserAvatar({
  name,
  email,
  avatarUrl,
  size = 'md',
  className = '',
}: UserAvatarProps) {
  const initials = getInitials(name, email)
  const [displayUrl, setDisplayUrl] = useState<string | null>(null)
  const [useSignedUrl, setUseSignedUrl] = useState(false)

  useEffect(() => {
    let isMounted = true
    setUseSignedUrl(false)

    if (!avatarUrl?.trim()) {
      setDisplayUrl(null)
      return () => {
        isMounted = false
      }
    }

    getAvatarDisplayUrl(avatarUrl).then((url) => {
      if (isMounted) setDisplayUrl(url)
    })

    return () => {
      isMounted = false
    }
  }, [avatarUrl])

  const handleImageError = async () => {
    if (useSignedUrl || !avatarUrl?.trim()) {
      setDisplayUrl(null)
      return
    }

    const signedUrl = await getAvatarSignedUrl(avatarUrl)
    if (signedUrl) {
      setUseSignedUrl(true)
      setDisplayUrl(signedUrl)
      return
    }

    setDisplayUrl(null)
  }

  return (
    <span className={`${styles.avatar} ${styles[size]} ${className}`} aria-hidden="true">
      {displayUrl ? (
        <img
          src={displayUrl}
          alt=""
          className={styles.image}
          onError={handleImageError}
        />
      ) : (
        <span className={styles.initials}>{initials}</span>
      )}
    </span>
  )
}
