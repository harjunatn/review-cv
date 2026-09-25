import react from '@vitejs/plugin-react'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { loadEnv, defineConfig, type Plugin } from 'vite'
import { handleReviewRequest } from './api/handleReview.ts'
import { LIMITS } from './src/lib/limits.ts'

function readRaw(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    let total = 0
    req.on('data', (chunk: Buffer) => {
      total += chunk.length
      if (total > LIMITS.maxBodyBytes) {
        reject(new Error('large'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

function header(req: IncomingMessage, name: string): string | undefined {
  const value = req.headers[name]
  return Array.isArray(value) ? value[0] : value
}

function reviewApiPlugin(): Plugin {
  return {
    name: 'review-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/review', (req, res) => {
        const envDir = server.config.envDir || process.cwd()
        void respond(server.config.mode, envDir, req, res)
      })
    },
  }
}

async function respond(
  mode: string,
  envDir: string,
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  const send = (status: number, body: unknown) => {
    res.statusCode = status
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.setHeader('Cache-Control', 'no-store')
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.end(JSON.stringify(body))
  }

  try {
    const raw = await readRaw(req)
    let body: unknown = undefined
    if (raw) {
      try {
        body = JSON.parse(raw) as unknown
      } catch {
        send(400, { error: 'Data tidak valid.' })
        return
      }
    }

    const env = loadEnv(mode, envDir, '')
    const result = await handleReviewRequest({
      method: req.method,
      origin: header(req, 'origin'),
      host: header(req, 'host'),
      body,
      apiKey: env.GEMINI_API_KEY,
      model: env.GEMINI_MODEL,
    })
    send(result.status, result.body)
  } catch (error) {
    const tooLarge = error instanceof Error && error.message === 'large'
    send(tooLarge ? 413 : 500, {
      error: tooLarge ? 'Data yang dikirim terlalu besar.' : 'Analisis gagal. Coba lagi.',
    })
  }
}

export default defineConfig({
  plugins: [react(), reviewApiPlugin()],
})
