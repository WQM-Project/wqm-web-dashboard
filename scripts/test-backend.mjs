import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
const output = mkdtempSync(path.join(tmpdir(), 'wqm-backend-tests-'))
try {
  const compiler = spawnSync(process.execPath, ['node_modules/typescript/bin/tsc',
    '--outDir', output, '--module', 'commonjs', '--target', 'ES2022',
    '--esModuleInterop', '--skipLibCheck', '--strict', 'tests/ingest.test.ts'], { stdio: 'inherit' })
  if (compiler.status !== 0) process.exitCode = compiler.status || 1
  else {
    const result = spawnSync(process.execPath, ['--test', path.join(output, 'tests/ingest.test.js')], {
      stdio: 'inherit', env: { ...process.env, NODE_PATH: path.resolve('node_modules') },
    })
    process.exitCode = result.status || 0
  }
} finally { rmSync(output, { recursive: true, force: true }) }
