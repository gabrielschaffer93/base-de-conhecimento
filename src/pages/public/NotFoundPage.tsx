import { Link } from 'react-router-dom'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'

export function NotFoundPage() {
  return (
    <EmptyState
      title="Página não encontrada"
      description="O endereço que você acessou não existe ou foi movido."
      action={
        <Link to="/">
          <Button>Voltar ao início</Button>
        </Link>
      }
    />
  )
}
