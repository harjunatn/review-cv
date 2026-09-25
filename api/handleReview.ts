import { LIMITS } from '../src/lib/limits.ts'
import { ReviewError } from '../src/lib/schema.ts'
import { runReview } from './reviewCore.ts'

export type ReviewHttpResult = {
  status: number
  body: unknown
}

function assertSameOrigin(origin: string | undefined, host: string | undefined): void {
  if (!origin || !host) throw new ReviewError(403, 'Permintaan ditolak.')

  let originHost = ''
  try {
    originHost = new URL(origin).host
  } catch {
    throw new ReviewError(403, 'Permintaan ditolak.')
  }

  if (originHost !== host) throw new ReviewError(403, 'Permintaan ditolak.')
}

function readBody(body: unknown): { jobDescription: string; cvText: string } {
  let parsed = body
  if (typeof body === 'string') {
    if (body.length > LIMITS.maxBodyBytes) {
      throw new ReviewError(413, 'Data yang dikirim terlalu besar.')
    }
    try {
      parsed = JSON.parse(body) as unknown
    } catch {
      throw new ReviewError(400, 'Data tidak valid.')
    }
  }

  if (!parsed || typeof parsed !== 'object') throw new ReviewError(400, 'Data tidak valid.')

  const record = parsed as Record<string, unknown>
  const jobDescription = typeof record.jobDescription === 'string' ? record.jobDescription.trim() : ''
  const cvText = typeof record.cvText === 'string' ? record.cvText.trim() : ''

  if (!jobDescription) throw new ReviewError(400, 'Job description masih kosong.')
  if (!cvText) throw new ReviewError(400, 'Teks CV masih kosong.')
  if (jobDescription.length > LIMITS.jobDescription) {
    throw new ReviewError(
      400,
      `Job description maksimal ${LIMITS.jobDescription.toLocaleString('id-ID')} karakter.`,
    )
  }
  if (cvText.length > LIMITS.cvText) {
    throw new ReviewError(400, `Teks CV maksimal ${LIMITS.cvText.toLocaleString('id-ID')} karakter.`)
  }

  return { jobDescription, cvText }
}

export async function handleReviewRequest(input: {
  method: string | undefined
  origin: string | undefined
  host: string | undefined
  body: unknown
  apiKey: string | undefined
  model: string | undefined
}): Promise<ReviewHttpResult> {
  try {
    if (input.method !== 'POST') return { status: 405, body: { error: 'Metode tidak didukung.' } }
    assertSameOrigin(input.origin, input.host)
    if (!input.apiKey) {
      return { status: 500, body: { error: 'Server belum dikonfigurasi. Tambahkan GEMINI_API_KEY.' } }
    }

    const review = await runReview({
      ...readBody(input.body),
      apiKey: input.apiKey,
      model: input.model,
    })
    return { status: 200, body: review }
  } catch (error) {
    if (error instanceof ReviewError) return { status: error.status, body: { error: error.message } }
    console.error('review failed')
    return { status: 500, body: { error: 'Analisis gagal. Coba lagi.' } }
  }
}
