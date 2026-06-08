import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { PageHeader } from '@/components/ui/PageHeader'
import { Spinner } from '@/components/ui/Spinner'
import { createTag, deleteTag, fetchTags, updateTag } from '@/features/tags/tagsService'
import type { Tag } from '@/types/database'
import styles from './CrudPage.module.css'

export function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [name, setName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)

  const reload = () => {
    setIsLoading(true)
    fetchTags()
      .then(setTags)
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    fetchTags()
      .then(setTags)
      .finally(() => setIsLoading(false))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    if (editingId) {
      await updateTag(editingId, name)
    } else {
      await createTag(name)
    }

    setName('')
    setEditingId(null)
    reload()
  }

  if (isLoading) return <Spinner />

  return (
    <div>
      <PageHeader title="Tags" description="Etiquetas para classificar artigos" />

      <Card className={styles.formCard}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <Input label="Nome da tag" value={name} onChange={(e) => setName(e.target.value)} />
          <div className={styles.formActions}>
            {editingId && (
              <Button type="button" variant="ghost" onClick={() => { setEditingId(null); setName('') }}>
                Cancelar
              </Button>
            )}
            <Button type="submit">{editingId ? 'Atualizar' : 'Criar tag'}</Button>
          </div>
        </form>
      </Card>

      <div className={styles.list}>
        {tags.map((tag) => (
          <Card key={tag.id} className={`${styles.row} ${styles.rowCenter}`}>
            <div className={styles.rowMain}>
              <strong>{tag.name}</strong>
              <span className={styles.meta}>/{tag.slug}</span>
            </div>
            <div className={styles.actions}>
              <Button variant="ghost" size="sm" onClick={() => { setEditingId(tag.id); setName(tag.name) }}>
                Editar
              </Button>
              <Button variant="danger" size="sm" onClick={async () => { if (confirm('Excluir?')) { await deleteTag(tag.id); reload() } }}>
                Excluir
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
