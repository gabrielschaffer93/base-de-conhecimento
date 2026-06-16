import { PILOT_POST_COUNT, REPORT_OUTPUT_PATH } from './wordpress-import/config.js'
import { runWordpressImport } from './wordpress-import/runImport.js'

async function main() {
  const report = await runWordpressImport({
    limit: PILOT_POST_COUNT,
    reportOutputPath: REPORT_OUTPUT_PATH,
  })

  console.log('\nPilot import finished.')
  console.log(`Created: ${report.created}, Updated: ${report.updated}, Failed: ${report.failed}`)
  console.log(`Report: scripts/output/pilot-import-report.json`)
  console.log('\nReview in admin: /admin/posts')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
