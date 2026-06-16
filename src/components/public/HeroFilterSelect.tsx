import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import styles from './HeroFilterSelect.module.css'

export interface HeroFilterOption {
  value: string
  label: string
}

interface HeroFilterSelectProps {
  label: string
  placeholder: string
  searchPlaceholder: string
  options: HeroFilterOption[]
  value?: string
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (value: string) => void
}

interface MenuPosition {
  top: number
  left: number
  width: number
}

function getMenuPosition(trigger: HTMLButtonElement): MenuPosition {
  const rect = trigger.getBoundingClientRect()
  return {
    top: rect.bottom + 6,
    left: rect.left,
    width: rect.width,
  }
}

function normalizeSearchText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export function HeroFilterSelect({
  label,
  placeholder,
  searchPlaceholder,
  options,
  value,
  isOpen,
  onOpenChange,
  onSelect,
}: HeroFilterSelectProps) {
  const menuId = useId()
  const listboxId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredOptions = useMemo(() => {
    const normalizedQuery = normalizeSearchText(searchQuery)
    if (!normalizedQuery) return options

    return options.filter((option) =>
      normalizeSearchText(option.label).includes(normalizedQuery),
    )
  }, [options, searchQuery])

  const selectedLabel = useMemo(() => {
    if (!value) return placeholder
    return options.find((option) => option.value === value)?.label ?? placeholder
  }, [options, placeholder, value])

  useLayoutEffect(() => {
    if (!isOpen || !triggerRef.current) {
      setMenuPosition(null)
      return
    }

    const updatePosition = () => {
      if (!triggerRef.current) return
      setMenuPosition(getMenuPosition(triggerRef.current))
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [isOpen, options.length])

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('')
      return
    }

    const frame = window.requestAnimationFrame(() => {
      searchInputRef.current?.focus()
    })

    return () => window.cancelAnimationFrame(frame)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (rootRef.current?.contains(target)) return
      if (menuRef.current?.contains(target)) return
      onOpenChange(false)
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onOpenChange(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onOpenChange])

  const handleSelect = (value: string) => {
    onSelect(value)
    onOpenChange(false)
  }

  const menu =
    isOpen && menuPosition
      ? createPortal(
          <div
            id={menuId}
            ref={menuRef}
            className={styles.menu}
            style={{
              top: menuPosition.top,
              left: menuPosition.left,
              width: menuPosition.width,
            }}
          >
            <div className={styles.searchWrap}>
              <span className={styles.searchIcon} aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                  <path
                    d="M20 20l-3.5-3.5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <input
                ref={searchInputRef}
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={searchPlaceholder}
                className={styles.searchInput}
                aria-controls={listboxId}
                aria-label={searchPlaceholder}
              />
            </div>

            <ul id={listboxId} className={styles.list} role="listbox" aria-label={label}>
              {filteredOptions.length === 0 ? (
                <li className={styles.emptyItem}>Nenhum resultado encontrado</li>
              ) : (
                filteredOptions.map((option) => (
                  <li key={option.value} role="none">
                    <button
                      type="button"
                      role="option"
                      className={styles.option}
                      onClick={() => handleSelect(option.value)}
                    >
                      {option.label}
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>,
          document.body,
        )
      : null

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className={`${styles.trigger} ${isOpen ? styles.triggerOpen : ''}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        onClick={() => onOpenChange(!isOpen)}
      >
        <span className={`${styles.triggerLabel} ${value ? styles.triggerLabelSelected : ''}`}>
          {selectedLabel}
        </span>
        <span className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`} aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path
              d="M6 9l6 6 6-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>
      {menu}
    </div>
  )
}
