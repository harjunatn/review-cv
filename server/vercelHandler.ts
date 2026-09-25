import type { IncomingMessage, ServerResponse } from 'node:http'
import { LIMITS } from '../src/lib/limits.ts'
import { handleReviewRequest } from './handleReview.ts'

type ReqLike = IncomingMessage & {
  body?: unknown
}

function header(req: IncomingMessage, name: string): string | undefined {
  const value = req.headers[name]
  if (Array.isArray(value)) return value[0]
  return value
}

function resolveHost(req: IncomingMessage): string | undefined {
  const forwarded = header(req, 'x-forwarded-host')
  if (forwarded) return forwarded.split(',')[0]?.trim()
  return header(req, 'host')
}

async function readBody(req: ReqLike): Promise<unknown> {
  if (req.body !== undefined) {
    if (Buffer.isBuffer(req.body)) {
      const text = req.body.toString('utf8')
      return text ? (JSON.parse(text) as unknown) : undefined
    }
    if (typeof req.body === 'string') {
      return req.body ? (JSON.parse(req.body) as unknown) : undefined
    }
    return req.body
  }

  const chunks: Buffer[] = []
  let total = 0
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    total += buffer.length
    if (total > LIMITS.maxBodyBytes) {
      const error = new Error('large')
      error.name = 'PayloadTooLarge'
      throw error
    }
    chunks.push(buffer)
  }

  const raw = Buffer.concat(chunks).toString('utf8')
  if (!raw) return undefined
  return JSON.parse(raw) as unknown
}

export default async function handler(req: ReqLike, res: ServerResponse): Promise<void> {
  const send = (status: number, body: unknown) => {
    res.statusCode = status
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.setHeader('Cache-Control', 'no-store')
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.end(JSON.stringify(body))
  }

  try {
    let body: unknown
    try {
      body = await readBody(req)
    } catch (error) {
      if (error instanceof Error && error.name === 'PayloadTooLarge') {
        send(413, { error: 'Data yang dikirim terlalu besar.' })
        return
      }
      send(400, { error: 'Data tidak valid.' })
      return
    }

    const result = await handleReviewRequest({
      method: req.method,
      origin: header(req, 'origin'),
      host: resolveHost(req),
      body,
      apiKey: process.env.GEMINI_API_KEY,
      model: process.env.GEMINI_MODEL,
    })
    send(result.status, result.body)
  } catch (error) {
    console.error('review handler crashed', error instanceof Error ? error.message : 'unknown')
    send(500, { error: 'Analisis gagal. Coba lagi.' })
  }
}
