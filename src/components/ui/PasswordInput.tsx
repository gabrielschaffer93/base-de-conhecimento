import { forwardRef, useState } from 'react'
import inputStyles from './Input.module.css'
import styles from './PasswordInput.module.css'

interface PasswordInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  error?: string
}

function EyeIcon() {
  return (
    <svg className={styles.icon} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg className={styles.icon} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9.9 4.24A10.45 10.45 0 0 1 12 4c6.5 0 10 7 10 7a18.36 18.36 0 0 1-2.16 3.19M6.72 6.72A18.36 18.36 0 0 0 2 12s3.5 7 10 7a10.45 10.45 0 0 0 5.1-1.24"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.73 10.73a3 3 0 0 0 4.24 4.24M3 3l18 18"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput({ label, error, id, className = '', ...props }, ref) {
    const [visible, setVisible] = useState(false)
    const inputId = id ?? props.name

    return (
      <div className={`${inputStyles.field} ${className}`}>
        {label && (
          <label htmlFor={inputId} className={inputStyles.label}>
            {label}
          </label>
        )}
        <div className={styles.wrapper}>
          <input
            ref={ref}
            id={inputId}
            type={visible ? 'text' : 'password'}
            className={`${inputStyles.input} ${styles.input} ${error ? inputStyles.inputError : ''}`}
            {...props}
          />
          <button
            type="button"
            className={styles.toggle}
            onClick={() => setVisible((current) => !current)}
            aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
            aria-pressed={visible}
          >
            {visible ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>
        {error && <span className={inputStyles.error}>{error}</span>}
      </div>
    )
  },
)
