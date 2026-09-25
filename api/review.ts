import type { IncomingMessage, ServerResponse } from 'node:http'
import { handleReviewRequest } from './handleReview.ts'

function header(req: IncomingMessage, name: string): string | undefined {
  const value = req.headers[name]
  if (Array.isArray(value)) return value[0]
  return value
}

export default async function handler(
  req: IncomingMessage & { body?: unknown },
  res: ServerResponse,
): Promise<void> {
  const result = await handleReviewRequest({
    method: req.method,
    origin: header(req, 'origin'),
    host: header(req, 'host'),
    body: req.body,
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL,
  })

  res.statusCode = result.status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.end(JSON.stringify(result.body))
}
