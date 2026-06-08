import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input, Textarea } from '@/components/ui/Input'
import { PageHeader } from '@/components/ui/PageHeader'
import { Spinner } from '@/components/ui/Spinner'
import {
  createCategory,
  deleteCategory,
  fetchCategories,
  updateCategory,
} from '@/features/categories/categoriesService'
import type { Category } from '@/types/database'
import styles from './CrudPage.module.css'

export function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)

  const reload = () => {
    setIsLoading(true)
    fetchCategories()
      .then(setCategories)
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    fetchCategories()
      .then(setCategories)
      .finally(() => setIsLoading(false))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    if (editingId) {
      await updateCategory(editingId, { name, description })
    } else {
      await createCategory({ name, description })
    }

    setName('')
    setDescription('')
    setEditingId(null)
    reload()
  }

  const handleEdit = (cat: Category) => {
    setEditingId(cat.id)
    setName(cat.name)
    setDescription(cat.description ?? '')
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Excluir esta categoria?')) return
    await deleteCategory(id)
    reload()
  }

  if (isLoading) return <Spinner />

  return (
    <div>
      <PageHeader title="Categorias" description="Organize os artigos por categorias" />

      <Card className={styles.formCard}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <Input label="Nome" value={name} onChange={(e) => setName(e.target.value)} />
          <Textarea
            label="Descrição"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
          <div className={styles.formActions}>
            {editingId && (
              <Button type="button" variant="ghost" onClick={() => { setEditingId(null); setName(''); setDescription('') }}>
                Cancelar
              </Button>
            )}
            <Button type="submit">{editingId ? 'Atualizar' : 'Criar categoria'}</Button>
          </div>
        </form>
      </Card>

      <div className={styles.list}>
        {categories.map((cat) => (
          <Card key={cat.id} className={styles.row}>
            <div>
              <strong>{cat.name}</strong>
              <span className={styles.meta}>/{cat.slug}</span>
              {cat.description && <p>{cat.description}</p>}
            </div>
            <div className={styles.actions}>
              <Button variant="ghost" size="sm" onClick={() => handleEdit(cat)}>Editar</Button>
              <Button variant="danger" size="sm" onClick={() => handleDelete(cat.id)}>Excluir</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
