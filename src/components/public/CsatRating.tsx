import { CSAT_SCORES, getCsatColor, type CsatScore } from '@/lib/csatColors'
import styles from './CsatRating.module.css'

interface CsatRatingProps {
  value: CsatScore | null
  averageScore?: number | null
  responseCount?: number
  disabled?: boolean
  onSelect: (score: CsatScore) => void
}

export function CsatRating({
  value,
  averageScore,
  responseCount = 0,
  disabled = false,
  onSelect,
}: CsatRatingProps) {
  return (
    <div className={styles.csat}>
      <div className={styles.csatHeader}>
        <p className={styles.csatLabel}>De 0 a 5, qual nota você dá para este artigo?</p>
        {responseCount > 0 && averageScore !== null && averageScore !== undefined && (
          <p className={styles.csatAverage}>
            Média CSAT: <strong>{averageScore.toFixed(1)}</strong>
          </p>
        )}
      </div>

      <div className={styles.csatBar} aria-hidden="true">
        <span className={styles.csatBarGradient} />
        <span className={styles.csatBarLabelBad}>0</span>
        <span className={styles.csatBarLabelGood}>5</span>
      </div>

      <div className={styles.csatScores} role="radiogroup" aria-label="Nota de satisfação de 0 a 5">
        {CSAT_SCORES.map((score) => {
          const color = getCsatColor(score)
          const isActive = value === score

          return (
            <button
              key={score}
              type="button"
              role="radio"
              aria-checked={isActive}
              aria-label={`Nota ${score}`}
              className={`${styles.csatCircle} ${isActive ? styles.csatCircleActive : ''}`}
              style={{ '--csat-color': color } as React.CSSProperties}
              disabled={disabled}
              onClick={() => onSelect(score)}
            >
              {score}
            </button>
          )
        })}
      </div>
    </div>
  )
}
