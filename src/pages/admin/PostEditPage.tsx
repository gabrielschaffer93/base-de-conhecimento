import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { Spinner } from '@/components/ui/Spinner'
import { RichTextEditor } from '@/components/editor/RichTextEditor'
import { useAuth } from '@/features/auth/useAuth'
import { fetchCategories } from '@/features/categories/categoriesService'
import { createPost, fetchPostById, updatePost } from '@/features/posts/postsService'
import { fetchTags } from '@/features/tags/tagsService'
import { slugify } from '@/lib/utils'
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
  const { id } = useParams<{ id: string }>()
  const isNew = id === 'new'
  const navigate = useNavigate()
  const { user } = useAuth()

  const [form, setForm] = useState<PostFormData>(defaultForm)
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [isLoading, setIsLoading] = useState(!isNew)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [slugManual, setSlugManual] = useState(false)

  useEffect(() => {
    fetchCategories().then(setCategories)
    fetchTags().then(setTags)
  }, [])

  useEffect(() => {
    if (isNew || !id) return
    fetchPostById(id)
      .then((post) => {
        if (!post) return
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
  }, [id, isNew])

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

  const handleSave = async (status?: PostStatus) => {
    if (!user) return
    if (!form.title.trim()) {
      setError('O título é obrigatório.')
      return
    }

    setIsSaving(true)
    setError(null)

    const payload = { ...form, status: status ?? form.status }

    try {
      if (isNew) {
        const post = await createPost(payload, user.id)
        navigate(`/admin/posts/${post.id}`, { replace: true })
      } else if (id) {
        await updatePost(id, payload)
      }
    } catch {
      setError('Erro ao salvar o post. Verifique se o slug já existe.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) return <Spinner />

  return (
    <div>
      <PageHeader
        title={isNew ? 'Novo post' : 'Editar post'}
        actions={
          <>
            <Button variant="ghost" onClick={() => navigate('/admin/posts')}>
              Cancelar
            </Button>
            <Button variant="secondary" isLoading={isSaving} onClick={() => handleSave('draft')}>
              Salvar rascunho
            </Button>
            <Button isLoading={isSaving} onClick={() => handleSave('published')}>
              Publicar
            </Button>
          </>
        }
      />

      {error && <p className={styles.error}>{error}</p>}

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
              />
            </div>
          </Card>
        </div>

        <div className={styles.sidebar}>
          <Card>
            <Select
              label="Categoria"
              placeholder="Selecione…"
              value={form.category_id ?? ''}
              onChange={(e) => updateField('category_id', e.target.value || null)}
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
            />

            <div className={styles.field}>
              <span className={styles.label}>Tags</span>
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
    </div>
  )
}
