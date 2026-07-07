import { readFileSync } from 'node:fs'
import { runWordpressImport } from './wordpress-import/runImport.js'
import { NOVOAJUDA_BASE_URL } from './wordpress-import/config.js'

interface GapAnalysis {
  missingFromImport: Array<{ slug: string; title: string; sourceUrl: string }>
}

const FALLBACK_SLUGS = [
  'treinamentoscrm',
  'ativacao-do-desconto-pontualidade',
  '08-menu-avancado',
  '09-menu-sistema',
  '11-integracao-com-portais',
  'enviar-imoveis-aos-portais',
  'como-pegar-o-link-xml-do-portal',
  'fechamento-e-vencimento-de-aluguel-postecipado',
  'baixa-manual-de-boletos',
  'previsao-de-multas-e-juros',
  'impressao-de-repasse-para-o-proprietario',
  'impressao-de-boletos-e-envio-por-e-mail',
  'estorno-de-boletos',
  'convite-proativo',
  'lembrete-clientes-desatualizados',
  'alterar-logo-marca-da-imobiliaria',
  'lembrete-imoveis-esperados-pelos-seus-clientes',
  'acessar-boleto-detalhes-plano',
  'como-posso-atualizar-os-clientes',
  'como-faco-para-cadastrar-um-cliente-que-ja-esta-cadastrado-no-crm-como-proprietario',
  'imovel-esta-exibindo-fotos-que-nao-foram-inseridas-em-seu-cadastro',
  'lista-de-usuarios-desatualizada-nos-layouts-de-pesquisa',
  'alterar-e-mail-de-contato-nas-cargas-de-portais',
  'alterar-foto-do-perfil-do-usuario',
  'google-chrome-paginas',
]

function loadMissingSlugs(): string[] {
  try {
    const analysis = JSON.parse(
      readFileSync('scripts/output/article-gap-analysis.json', 'utf8'),
    ) as GapAnalysis
    if (analysis.missingFromImport?.length) {
      return analysis.missingFromImport.map((item) => item.slug)
    }
  } catch {
    // use fallback list
  }
  return FALLBACK_SLUGS
}

async function main() {
  const slugs = loadMissingSlugs()

  console.log(`Importing ${slugs.length} missing articles from ${NOVOAJUDA_BASE_URL}...`)

  const report = await runWordpressImport({
    slugs,
    baseUrl: NOVOAJUDA_BASE_URL,
    reportOutputPath: 'scripts/output/missing-import-report.json',
    delayMs: 350,
  })

  console.log('\nMissing import finished.')
  console.log(`Created: ${report.created}, Updated: ${report.updated}, Failed: ${report.failed}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
