import { runWordpressImport } from './wordpress-import/runImport.js'

const RETRY_SLUGS = [
  'como-faco-para-cadastrar-um-cliente-que-ja-esta-cadastrado-no-crm-como-proprietario',
  'google-chrome-paginas',
]

async function main() {
  const report = await runWordpressImport({
    slugs: RETRY_SLUGS,
    reportOutputPath: 'scripts/output/retry-import-report.json',
  })

  console.log('\nRetry import finished.')
  console.log(`Created: ${report.created}, Updated: ${report.updated}, Failed: ${report.failed}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
