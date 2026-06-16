import { runWordpressImport } from './wordpress-import/runImport.js'

const FULL_REPORT_PATH = 'scripts/output/full-import-report.json'

async function main() {
  const report = await runWordpressImport({
    reportOutputPath: FULL_REPORT_PATH,
    delayMs: 300,
  })

  console.log('\nFull import finished.')
  console.log(`Listed: ${report.totalListed}`)
  console.log(`Created: ${report.created}, Updated: ${report.updated}, Failed: ${report.failed}`)
  console.log(`Report: ${FULL_REPORT_PATH}`)

  if (report.failed > 0) {
    console.log('\nFailed slugs:')
    for (const item of report.errors) {
      console.log(`  - ${item.slug}: ${item.message}`)
    }
    process.exit(1)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
