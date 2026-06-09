import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { Spinner } from '@/components/ui/Spinner'
import { RichTextEditor } from '@/components/editor/RichTextEditor'
import { PostPreviewModal } from '@/components/posts/PostPreviewModal'
import { PostPublishedModal } from '@/components/posts/PostPublishedModal'
import { useAuth } from '@/features/auth/useAuth'
import { fetchCategories, createCategory } from '@/features/categories/categoriesService'
import { createPost, fetchPostById, getPostSaveErrorMessage, isSlugTaken, findPostSummaryBySlug, updatePost, updatePostStatus } from '@/features/posts/postsService'
import { fetchTags, createTag } from '@/features/tags/tagsService'
import { slugify, getStatusLabel, isValidUuid } from '@/lib/utils'
import type { Category, PostFormData, PostStatus, Tag } from '@/types/database'
import styles from './PostEditPage.module.css'

const emptyContent = { type: 'doc', content: [{ type: 'paragraph' }] }

const defaultForm: PostFormData = {
  title: '',
  slug: '',
  excerpt: '',
  content: emptyContent,
  status: 'draft',
  category_id: null,
  tag_ids: [],
  featured_image_url: null,
  meta_title: '',
  meta_description: '',
}

export function PostEditPage() {
  const { id: routeId } = useParams<{ id: string }>()
  const postId = routeId && routeId !== 'new' && isValidUuid(routeId) ? routeId : null
  const isNew = !postId
  const navigate = useNavigate()
  const { user, profile } = useAuth()

  const [form, setForm] = useState<PostFormData>(defaultForm)
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [isLoading, setIsLoading] = useState(!isNew)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [slugConflictPostId, setSlugConflictPostId] = useState<string | null>(null)
  const [slugManual, setSlugManual] = useState(false)
  const [showArticlePreview, setShowArticlePreview] = useState(false)
  const [publishedPost, setPublishedPost] = useState<{ title: string; slug: string } | null>(null)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newTagName, setNewTagName] = useState('')
  const [isCreatingCategory, setIsCreatingCategory] = useState(false)
  const [isCreatingTag, setIsCreatingTag] = useState(false)
  const [categoryError, setCategoryError] = useState<string | null>(null)
  const [tagError, setTagError] = useState<string | null>(null)

  useEffect(() => {
    if (routeId && routeId !== 'new' && !isValidUuid(routeId)) {
      navigate('/admin/posts/new', { replace: true })
    }
  }, [routeId, navigate])

  useEffect(() => {
    fetchCategories().then(setCategories)
    fetchTags().then(setTags)
  }, [])

  useEffect(() => {
    if (isNew) return

    fetchPostById(postId!)
      .then((post) => {
        if (!post) {
          setError('Post não encontrado.')
          navigate('/admin/posts/new', { replace: true })
          return
        }
        setForm({
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt ?? '',
          content: post.content,
          status: post.status,
          category_id: post.category_id,
          tag_ids: post.tags?.map((t) => t.id) ?? [],
          featured_image_url: post.featured_image_url,
          meta_title: post.meta_title ?? '',
          meta_description: post.meta_description ?? '',
        })
        setSlugManual(true)
      })
      .finally(() => setIsLoading(false))
  }, [postId, isNew, navigate])

  const updateField = <K extends keyof PostFormData>(key: K, value: PostFormData[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value }
      if (key === 'title' && !slugManual) {
        next.slug = slugify(String(value))
      }
      return next
    })
  }

  const toggleTag = (tagId: string) => {
    setForm((prev) => ({
      ...prev,
      tag_ids: prev.tag_ids.includes(tagId)
        ? prev.tag_ids.filter((id) => id !== tagId)
        : [...prev.tag_ids, tagId],
    }))
  }

  const handleCreateCategory = async () => {
    const name = newCategoryName.trim()
    if (!name) return

    setCategoryError(null)

    const existing = categories.find((category) => category.name.toLowerCase() === name.toLowerCase())
    if (existing) {
      updateField('category_id', existing.id)
      setNewCategoryName('')
      return
    }

    setIsCreatingCategory(true)
    try {
      const category = await createCategory({ name })
      setCategories((prev) =>
        [...prev, category].sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name)),
      )
      updateField('category_id', category.id)
      setNewCategoryName('')
    } catch {
      setCategoryError('Não foi possível criar a categoria.')
    } finally {
      setIsCreatingCategory(false)
    }
  }

  const handleCreateTag = async () => {
    const name = newTagName.trim()
    if (!name) return

    setTagError(null)

    const existing = tags.find((tag) => tag.name.toLowerCase() === name.toLowerCase())
    if (existing) {
      setForm((prev) =>
        prev.tag_ids.includes(existing.id)
          ? prev
          : { ...prev, tag_ids: [...prev.tag_ids, existing.id] },
      )
      setNewTagName('')
      return
    }

    setIsCreatingTag(true)
    try {
      const tag = await createTag(name)
      setTags((prev) => [...prev, tag].sort((a, b) => a.name.localeCompare(b.name)))
      setForm((prev) => ({ ...prev, tag_ids: [...prev.tag_ids, tag.id] }))
      setNewTagName('')
    } catch {
      setTagError('Não foi possível criar a tag.')
    } finally {
      setIsCreatingTag(false)
    }
  }

  const handleCategoryKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      void handleCreateCategory()
    }
  }

  const handleTagKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      void handleCreateTag()
    }
  }

  const handleSave = async (status?: PostStatus) => {
    if (!user) return
    if (!form.title.trim()) {
      setError('O título é obrigatório.')
      return
    }

    const normalizedSlug = slugify(form.slug.trim() || form.title.trim())
    if (!normalizedSlug) {
      setError('Não foi possível gerar um slug válido a partir do título.')
      return
    }

    setIsSaving(true)
    setError(null)
    setSlugConflictPostId(null)

    const targetStatus = status ?? form.status
    const isPublishing = targetStatus === 'published'

    const payload = {
      ...form,
      slug: normalizedSlug,
      status: targetStatus,
      category_id: form.category_id && isValidUuid(form.category_id) ? form.category_id : null,
      tag_ids: form.tag_ids.filter(isValidUuid),
    }

    try {
      const slugTaken = await isSlugTaken(normalizedSlug, isNew ? undefined : postId ?? undefined)
      if (slugTaken) {
        const existing = await findPostSummaryBySlug(normalizedSlug)
        if (existing) {
          setSlugConflictPostId(existing.id)
          setError(
            `O slug "${normalizedSlug}" já está em uso pelo post "${existing.title}" (${getStatusLabel(existing.status)}).`,
          )
        } else {
          setError('Este slug já está em uso. Altere o slug e tente novamente.')
        }
        return
      }

      if (isNew) {
        const post = await createPost(payload, user.id)
        if (isPublishing) {
          setPublishedPost({ title: post.title, slug: post.slug })
          setForm((prev) => ({ ...prev, slug: post.slug, status: 'published' }))
        } else {
          navigate(`/admin/posts/${post.id}`, { replace: true })
        }
      } else if (postId) {
        await updatePost(postId, payload)
        setForm((prev) => ({ ...prev, slug: normalizedSlug, status: payload.status }))
        if (isPublishing) {
          setPublishedPost({ title: form.title.trim(), slug: normalizedSlug })
        }
      }
    } catch (err) {
      setError(getPostSaveErrorMessage(err))
    } finally {
      setIsSaving(false)
    }
  }

  const handlePublishedModalClose = () => {
    setPublishedPost(null)
    navigate('/admin/posts')
  }

  const handleArchive = async () => {
    if (!postId) return
    if (
      !window.confirm(
        'Arquivar este post? Ele deixará de aparecer no site público.',
      )
    ) {
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      await updatePostStatus(postId, 'archived')
      navigate('/admin/posts')
    } catch (err) {
      setError(getPostSaveErrorMessage(err))
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) return <Spinner />

  const selectedCategory = categories.find((c) => c.id === form.category_id)
  const selectedTags = tags.filter((t) => form.tag_ids.includes(t.id))

  return (
    <div>
      <PageHeader
        title={isNew ? 'Novo post' : 'Editar post'}
        actions={
          <>
            <Button variant="ghost" onClick={() => navigate('/admin/posts')}>
              Cancelar
            </Button>
            <Button variant="secondary" onClick={() => setShowArticlePreview(true)}>
              Prévia do artigo
            </Button>
            {!isNew && form.status !== 'archived' && (
              <Button variant="ghost" isLoading={isSaving} onClick={() => void handleArchive()}>
                Arquivar
              </Button>
            )}
            {form.status === 'archived' ? (
              <Button isLoading={isSaving} onClick={() => handleSave('published')}>
                Republicar
              </Button>
            ) : (
              <>
                <Button variant="secondary" isLoading={isSaving} onClick={() => handleSave('draft')}>
                  Salvar rascunho
                </Button>
                <Button isLoading={isSaving} onClick={() => handleSave('published')}>
                  Publicar
                </Button>
              </>
            )}
          </>
        }
      />

      {error && (
        <div className={styles.errorBox}>
          <p className={styles.error}>{error}</p>
          {slugConflictPostId && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate(`/admin/posts/${slugConflictPostId}`)}
            >
              Abrir post existente
            </Button>
          )}
        </div>
      )}

      <div className={styles.grid}>
        <div className={styles.main}>
          <Card>
            <Input
              label="Título"
              value={form.title}
              onChange={(e) => updateField('title', e.target.value)}
            />
            <Input
              label="Slug"
              value={form.slug}
              onChange={(e) => {
                setSlugManual(true)
                updateField('slug', e.target.value)
              }}
            />
            <Textarea
              label="Resumo"
              value={form.excerpt}
              onChange={(e) => updateField('excerpt', e.target.value)}
              rows={3}
            />
            <div className={styles.field}>
              <label className={styles.label}>Conteúdo</label>
              <RichTextEditor
                content={form.content}
                onChange={(content) => updateField('content', content)}
                userId={user?.id}
                onPreviewRequest={() => setShowArticlePreview(true)}
              />
            </div>
          </Card>
        </div>

        <div className={styles.sidebar}>
          <Card>
            <div className={styles.field}>
              <Select
                label="Categoria"
                placeholder="Selecione…"
                value={form.category_id ?? ''}
                onChange={(e) => updateField('category_id', e.target.value || null)}
                options={categories.map((c) => ({ value: c.id, label: c.name }))}
              />
              <div className={styles.inlineCreate}>
                <Input
                  className={styles.inlineCreateInput}
                  placeholder="Nova categoria…"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={handleCategoryKeyDown}
                />
                <Button
                  type="button"
                  size="sm"
                  isLoading={isCreatingCategory}
                  onClick={() => void handleCreateCategory()}
                >
                  Criar
                </Button>
              </div>
              {categoryError && <span className={styles.fieldError}>{categoryError}</span>}
            </div>

            <div className={styles.field}>
              <span className={styles.label}>Tags</span>
              {tags.length > 0 ? (
                <div className={styles.tagList}>
                  {tags.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      className={`${styles.tagChip} ${form.tag_ids.includes(tag.id) ? styles.tagActive : ''}`}
                      onClick={() => toggleTag(tag.id)}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              ) : (
                <p className={styles.emptyHint}>Nenhuma tag cadastrada ainda.</p>
              )}
              <div className={styles.inlineCreate}>
                <Input
                  className={styles.inlineCreateInput}
                  placeholder="Nova tag…"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                />
                <Button
                  type="button"
                  size="sm"
                  isLoading={isCreatingTag}
                  onClick={() => void handleCreateTag()}
                >
                  Adicionar
                </Button>
              </div>
              {tagError && <span className={styles.fieldError}>{tagError}</span>}
            </div>

            <Input
              label="Imagem destaque (URL)"
              value={form.featured_image_url ?? ''}
              onChange={(e) => updateField('featured_image_url', e.target.value || null)}
            />

            <Input
              label="Meta título (SEO)"
              value={form.meta_title}
              onChange={(e) => updateField('meta_title', e.target.value)}
            />
            <Textarea
              label="Meta descrição (SEO)"
              value={form.meta_description}
              onChange={(e) => updateField('meta_description', e.target.value)}
              rows={2}
            />
          </Card>
        </div>
      </div>

      <PostPublishedModal
        open={publishedPost !== null}
        onClose={handlePublishedModalClose}
        title={publishedPost?.title ?? ''}
        slug={publishedPost?.slug ?? ''}
      />

      <PostPreviewModal
        open={showArticlePreview}
        onClose={() => setShowArticlePreview(false)}
        post={{
          title: form.title.trim() || 'Título do artigo',
          excerpt: form.excerpt || null,
          content: form.content,
          featuredImageUrl: form.featured_image_url,
          category: selectedCategory
            ? { name: selectedCategory.name, slug: selectedCategory.slug }
            : null,
          tags: selectedTags,
          authorName: profile?.full_name ?? null,
          publishedAt: form.status === 'published' ? new Date().toISOString() : null,
          createdAt: new Date().toISOString(),
        }}
      />
    </div>
  )
}
