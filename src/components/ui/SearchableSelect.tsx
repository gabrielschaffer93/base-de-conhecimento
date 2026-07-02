import { useEffect, useId, useMemo, useRef, useState } from 'react'
import styles from './SearchableSelect.module.css'

export interface SearchableSelectOption {
  value: string
  label: string
}

interface SearchableSelectBaseProps {
  label?: string
  placeholder?: string
  searchPlaceholder?: string
  options: SearchableSelectOption[]
  error?: string
  emptyMessage?: string
}

interface SingleSearchableSelectProps extends SearchableSelectBaseProps {
  multiple?: false
  value: string
  onChange: (value: string) => void
}

interface MultipleSearchableSelectProps extends SearchableSelectBaseProps {
  multiple: true
  value: string[]
  onChange: (value: string[]) => void
}

export type SearchableSelectProps = SingleSearchableSelectProps | MultipleSearchableSelectProps

function normalizeSearchText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function getTriggerLabel(
  placeholder: string,
  options: SearchableSelectOption[],
  value: string | string[],
  multiple: boolean,
): string {
  if (multiple) {
    const selected = options.filter((option) => (value as string[]).includes(option.value))
    if (selected.length === 0) return placeholder
    if (selected.length === 1) return selected[0].label
    return `${selected.length} selecionadas`
  }

  if (!value) return placeholder
  return options.find((option) => option.value === value)?.label ?? placeholder
}

export function SearchableSelect(props: SearchableSelectProps) {
  const {
    label,
    placeholder = 'Selecione…',
    searchPlaceholder = 'Buscar…',
    options,
    error,
    emptyMessage = 'Nenhum resultado encontrado',
    multiple = false,
  } = props

  const listboxId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredOptions = useMemo(() => {
    const normalizedQuery = normalizeSearchText(searchQuery)
    if (!normalizedQuery) return options

    return options.filter((option) =>
      normalizeSearchText(option.label).includes(normalizedQuery),
    )
  }, [options, searchQuery])

  const triggerLabel = getTriggerLabel(
    placeholder,
    options,
    multiple ? (props.value as string[]) : (props.value as string),
    multiple,
  )

  const selectedOptions = multiple
    ? options.filter((option) => (props.value as string[]).includes(option.value))
    : []

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
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const handleSelect = (optionValue: string) => {
    if (multiple) {
      const current = props.value as string[]
      const next = current.includes(optionValue)
        ? current.filter((id) => id !== optionValue)
        : [...current, optionValue]
      ;(props.onChange as (value: string[]) => void)(next)
      return
    }

    ;(props.onChange as (value: string) => void)(optionValue)
    setIsOpen(false)
  }

  const handleRemoveTag = (optionValue: string) => {
    if (!multiple) return
    const current = props.value as string[]
    ;(props.onChange as (value: string[]) => void)(current.filter((id) => id !== optionValue))
  }

  const isSelected = (optionValue: string) => {
    if (multiple) return (props.value as string[]).includes(optionValue)
    return props.value === optionValue
  }

  return (
    <div className={styles.field} ref={rootRef}>
      {label && <span className={styles.label}>{label}</span>}

      <button
        type="button"
        className={`${styles.trigger} ${isOpen ? styles.triggerOpen : ''} ${error ? styles.triggerError : ''}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span className={`${styles.triggerLabel} ${triggerLabel !== placeholder ? styles.triggerLabelSelected : ''}`}>
          {triggerLabel}
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

      {isOpen && (
        <div className={styles.menu}>
          <div className={styles.searchWrap}>
            <span className={styles.searchIcon} aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
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

          <ul id={listboxId} className={styles.list} role="listbox" aria-label={label ?? placeholder}>
            {filteredOptions.length === 0 ? (
              <li className={styles.emptyItem}>{emptyMessage}</li>
            ) : (
              filteredOptions.map((option) => (
                <li key={option.value} role="none">
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected(option.value)}
                    className={`${styles.option} ${isSelected(option.value) ? styles.optionSelected : ''}`}
                    onClick={() => handleSelect(option.value)}
                  >
                    <span>{option.label}</span>
                    {multiple && isSelected(option.value) && (
                      <span className={styles.checkIcon} aria-hidden="true">
                        ✓
                      </span>
                    )}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}

      {multiple && selectedOptions.length > 0 && (
        <div className={styles.selectedList}>
          {selectedOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={styles.selectedChip}
              onClick={() => handleRemoveTag(option.value)}
              aria-label={`Remover ${option.label}`}
            >
              {option.label}
              <span aria-hidden="true">×</span>
            </button>
          ))}
        </div>
      )}

      {error && <span className={styles.error}>{error}</span>}
    </div>
  )
}
