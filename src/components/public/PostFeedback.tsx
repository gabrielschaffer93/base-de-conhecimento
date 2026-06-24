import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Input'
import { CsatRating } from '@/components/public/CsatRating'
import {
  fetchPostFeedbackSummary,
  submitPostFeedback,
  type PostFeedbackSummary,
} from '@/features/feedback/feedbackService'
import type { CsatScore } from '@/lib/csatColors'
import type { FeedbackVote } from '@/lib/visitorKey'
import styles from './PostFeedback.module.css'

interface PostFeedbackProps {
  postId: string
}

const THANK_YOU_MODAL_DURATION_MS = 3000

function FeedbackThankYouModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null

  return (
    <div className={styles.modalOverlay} onClick={onClose} role="presentation">
      <div
        className={styles.modalDialog}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-thank-you-title"
        aria-live="polite"
      >
        <div className={styles.modalIconWrap} aria-hidden="true">
          <svg className={styles.modalIcon} viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
            <path
              d="M8 12.5l2.5 2.5L16 9"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h2 id="feedback-thank-you-title" className={styles.modalTitle}>
          Muito obrigado!
        </h2>
      </div>
    </div>
  )
}

function ThumbUpIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7 11v8a1 1 0 0 0 1 1h2v-9H8a1 1 0 0 0-1 1Zm3-8h7.2a2 2 0 0 1 1.94 1.52l1.3 5.7a2 2 0 0 1-1.95 2.48H14v6a1 1 0 0 1-1 1H9.5a1 1 0 0 1-.98-1.2l1.2-6A2 2 0 0 0 7 11V5a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ThumbDownIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M17 13V5a1 1 0 0 0-1-1h-2v9h2a1 1 0 0 0 1-1Zm-3 8H6.8a2 2 0 0 1-1.94-1.52l-1.3-5.7a2 2 0 0 1 1.95-2.48H10V7a1 1 0 0 1 1-1h3.5a1 1 0 0 1 .98 1.2l-1.2 6a2 2 0 0 0 1.72 2.4v2a2 2 0 0 1-2 2Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function PostFeedback({ postId }: PostFeedbackProps) {
  const [summary, setSummary] = useState<PostFeedbackSummary>({
    likesCount: 0,
    dislikesCount: 0,
    avgCsat: null,
    csatCount: 0,
  })
  const [userVote, setUserVote] = useState<FeedbackVote | null>(null)
  const [userCsat, setUserCsat] = useState<CsatScore | null>(null)
  const [comment, setComment] = useState('')
  const [commentSent, setCommentSent] = useState(false)
  const [showThankYouModal, setShowThankYouModal] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSavingCsat, setIsSavingCsat] = useState(false)
  const [isSavingComment, setIsSavingComment] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasInteraction = userVote !== null || userCsat !== null

  useEffect(() => {
    if (!showThankYouModal) return

    const timer = window.setTimeout(() => {
      setShowThankYouModal(false)
    }, THANK_YOU_MODAL_DURATION_MS)

    return () => window.clearTimeout(timer)
  }, [showThankYouModal])

  useEffect(() => {
    let cancelled = false

    fetchPostFeedbackSummary(postId)
      .then((data) => {
        if (!cancelled) setSummary(data)
      })
      .catch(() => {
        if (!cancelled) setError('Não foi possível carregar as avaliações.')
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [postId])

  const applySummary = (result: PostFeedbackSummary) => {
    setSummary(result)
  }

  const handleCsatSelect = async (score: CsatScore) => {
    if (isSavingCsat) return

    setError(null)
    setIsSavingCsat(true)

    try {
      const result = await submitPostFeedback({
        postId,
        csatScore: score,
        vote: userVote,
      })
      applySummary(result)
      setUserCsat(result.userCsat)
    } catch (csatError) {
      setError(csatError instanceof Error ? csatError.message : 'Não foi possível registrar sua nota.')
    } finally {
      setIsSavingCsat(false)
    }
  }

  const handleVote = async (vote: FeedbackVote) => {
    if (isSubmitting) return

    setError(null)
    setIsSubmitting(true)

    try {
      const result = await submitPostFeedback({
        postId,
        vote,
        csatScore: userCsat,
      })
      applySummary(result)
      setUserVote(result.userVote)
    } catch (voteError) {
      setError(voteError instanceof Error ? voteError.message : 'Não foi possível registrar sua avaliação.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCommentSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!hasInteraction || isSavingComment) return

    const trimmedComment = comment.trim()
    if (!trimmedComment) {
      setError('Escreva um comentário antes de enviar.')
      return
    }

    setError(null)
    setIsSavingComment(true)

    try {
      const result = await submitPostFeedback({
        postId,
        vote: userVote,
        csatScore: userCsat,
        comment: trimmedComment,
      })
      applySummary(result)
      setComment('')
      setCommentSent(true)
      setShowThankYouModal(true)
    } catch (commentError) {
      setError(
        commentError instanceof Error ? commentError.message : 'Não foi possível enviar seu comentário.',
      )
    } finally {
      setIsSavingComment(false)
    }
  }

  const commentLabel =
    userVote === -1
      ? 'O que podemos melhorar neste artigo?'
      : 'O que foi mais útil para você?'

  return (
    <>
      <FeedbackThankYouModal
        open={showThankYouModal}
        onClose={() => setShowThankYouModal(false)}
      />

      <section className={styles.feedback} aria-label="Avaliação do artigo">
        <div className={styles.feedbackCard}>
          <h2 className={styles.title}>Este artigo foi útil?</h2>
          <p className={styles.subtitle}>Sua opinião nos ajuda a melhorar o conteúdo da base de conhecimento.</p>

          <CsatRating
            value={userCsat}
            averageScore={summary.avgCsat}
            responseCount={summary.csatCount}
            disabled={isLoading || isSavingCsat}
            onSelect={(score) => void handleCsatSelect(score)}
          />

          <div className={styles.sectionDivider} />

          <p className={styles.secondaryLabel}>Você gostou do conteúdo?</p>

          <div className={styles.actions}>
            <button
              type="button"
              className={`${styles.voteBtn} ${styles.likeBtn} ${userVote === 1 ? styles.voteBtnActive : ''}`}
              onClick={() => void handleVote(1)}
              disabled={isLoading || isSubmitting}
              aria-pressed={userVote === 1}
            >
              <ThumbUpIcon />
              Gostei
              {!isLoading && summary.likesCount > 0 && (
                <span className={styles.count}>{summary.likesCount}</span>
              )}
            </button>

            <button
              type="button"
              className={`${styles.voteBtn} ${styles.dislikeBtn} ${userVote === -1 ? styles.voteBtnActive : ''}`}
              onClick={() => void handleVote(-1)}
              disabled={isLoading || isSubmitting}
              aria-pressed={userVote === -1}
            >
              <ThumbDownIcon />
              Não gostei
              {!isLoading && summary.dislikesCount > 0 && (
                <span className={styles.count}>{summary.dislikesCount}</span>
              )}
            </button>
          </div>

          {hasInteraction && !commentSent && (
            <form className={styles.commentForm} onSubmit={(event) => void handleCommentSubmit(event)}>
              <Textarea
                label={`${commentLabel} (opcional)`}
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                rows={4}
                maxLength={1000}
                placeholder="Compartilhe sugestões, dúvidas ou o que faltou no conteúdo..."
              />
              <div className={styles.commentActions}>
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  className={styles.commentSubmitBtn}
                  isLoading={isSavingComment}
                >
                  Enviar comentário
                </Button>
              </div>
            </form>
          )}

          {hasInteraction && !showThankYouModal && (
            <p className={styles.thankYou} role="status">
              Obrigado pela sua avaliação!
            </p>
          )}

          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}
        </div>
      </section>
    </>
  )
}
