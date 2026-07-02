import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useBlocker, useBeforeUnload } from 'react-router-dom'
import { autoSavePostDraft } from '@/features/posts/postsService'
import { hasMinimumAutoSaveContent, serializePostForm } from '@/features/posts/postFormUtils'
import type { PostFormData } from '@/types/database'

interface UsePostAutoSaveOnLeaveOptions {
  form: PostFormData
  postId: string | null
  userId?: string
  enabled: boolean
  isSaving: boolean
}

export function usePostAutoSaveOnLeave({
  form,
  postId,
  userId,
  enabled,
  isSaving,
}: UsePostAutoSaveOnLeaveOptions) {
  const formRef = useRef(form)
  const postIdRef = useRef(postId)
  const savedSnapshotRef = useRef<string | null>(null)
  const skipAutoSaveRef = useRef(false)
  const isAutoSavingRef = useRef(false)
  const [savedSnapshot, setSavedSnapshot] = useState<string | null>(null)

  formRef.current = form
  postIdRef.current = postId
  savedSnapshotRef.current = savedSnapshot

  useEffect(() => {
    if (!enabled) {
      setSavedSnapshot(null)
      return
    }

    const baseline = serializePostForm(formRef.current)
    setSavedSnapshot(baseline)
  }, [enabled, postId])

  const isDirty = useMemo(() => {
    if (!enabled || savedSnapshot === null) return false
    return serializePostForm(form) !== savedSnapshot
  }, [enabled, form, savedSnapshot])

  const markAsSaved = useCallback((savedForm: PostFormData) => {
    const snapshot = serializePostForm(savedForm)
    savedSnapshotRef.current = snapshot
    setSavedSnapshot(snapshot)
  }, [])

  const skipNextAutoSave = useCallback(() => {
    skipAutoSaveRef.current = true
  }, [])

  const performAutoSave = useCallback(async (): Promise<boolean> => {
    if (
      skipAutoSaveRef.current ||
      isAutoSavingRef.current ||
      isSaving ||
      !userId ||
      !enabled
    ) {
      return false
    }

    const currentForm = formRef.current
    if (!hasMinimumAutoSaveContent(currentForm)) return false

    const snapshot = serializePostForm(currentForm)
    if (savedSnapshotRef.current !== null && snapshot === savedSnapshotRef.current) {
      return false
    }

    isAutoSavingRef.current = true

    try {
      const savedPost = await autoSavePostDraft(currentForm, userId, postIdRef.current)
      if (!savedPost) return false

      if (!postIdRef.current) {
        postIdRef.current = savedPost.id
      }

      const savedForm: PostFormData = {
        ...currentForm,
        slug: savedPost.slug,
        status: savedPost.status,
      }
      const nextSnapshot = serializePostForm(savedForm)
      savedSnapshotRef.current = nextSnapshot
      setSavedSnapshot(nextSnapshot)

      return true
    } catch {
      return false
    } finally {
      isAutoSavingRef.current = false
    }
  }, [enabled, isSaving, userId])

  const shouldAutoSave = isDirty && !isSaving

  useBeforeUnload(
    useCallback(
      (event) => {
        if (!shouldAutoSave || !hasMinimumAutoSaveContent(formRef.current)) return
        event.preventDefault()
      },
      [shouldAutoSave],
    ),
  )

  const blocker = useBlocker(shouldAutoSave)

  useEffect(() => {
    if (blocker.state !== 'blocked') return

    void performAutoSave().finally(() => {
      if (blocker.state === 'blocked') {
        blocker.proceed()
      }
    })
  }, [blocker, performAutoSave])

  useEffect(() => {
    const handlePageHide = () => {
      if (!shouldAutoSave || !hasMinimumAutoSaveContent(formRef.current)) return
      void performAutoSave()
    }

    window.addEventListener('pagehide', handlePageHide)
    return () => window.removeEventListener('pagehide', handlePageHide)
  }, [performAutoSave, shouldAutoSave])

  return {
    isDirty,
    markAsSaved,
    skipNextAutoSave,
  }
}
