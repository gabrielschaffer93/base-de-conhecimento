import { useEffect, useRef } from 'react'
import { recordReadingSession } from '@/features/analytics/analyticsService'
import { getVisitorKey } from '@/lib/visitorKey'

const HEARTBEAT_MS = 15_000
const MIN_DURATION_SECONDS = 5

export function usePostReadingTracker(postId: string | undefined) {
  const activeSecondsRef = useRef(0)
  const isVisibleRef = useRef(!document.hidden)
  const hasSentRef = useRef(false)

  useEffect(() => {
    if (!postId) return

    hasSentRef.current = false
    activeSecondsRef.current = 0
    isVisibleRef.current = !document.hidden

    const flush = () => {
      if (hasSentRef.current || activeSecondsRef.current < MIN_DURATION_SECONDS) return
      hasSentRef.current = true
      void recordReadingSession(postId, getVisitorKey(), activeSecondsRef.current)
    }

    const heartbeat = window.setInterval(() => {
      if (isVisibleRef.current) {
        activeSecondsRef.current += HEARTBEAT_MS / 1000
      }
    }, HEARTBEAT_MS)

    const handleVisibilityChange = () => {
      isVisibleRef.current = !document.hidden
      if (document.hidden) flush()
    }

    const handlePageHide = () => flush()

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('pagehide', handlePageHide)

    return () => {
      window.clearInterval(heartbeat)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('pagehide', handlePageHide)
      flush()
    }
  }, [postId])
}
