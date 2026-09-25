import { handleReviewRequest } from '../api/handleReview.ts'
import { itemsToText } from '../src/lib/textItems.ts'
import { parseReview, ReviewError } from '../src/lib/schema.ts'

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message)
}

const lines = itemsToText([
  { str: 'Budi', transform: [1, 0, 0, 1, 72, 720], hasEOL: false },
  { str: 'Santoso', transform: [1, 0, 0, 1, 110, 720], hasEOL: true },
  { str: 'Frontend Developer', transform: [1, 0, 0, 1, 72, 690], hasEOL: true },
  { type: 'beginMarkedContent' },
])
assert(lines === 'Budi Santoso\nFrontend Developer', `itemsToText gagal: ${lines}`)

const review = parseReview({
  candidateName: 'Budi',
  targetRole: 'Frontend',
  companyName: '',
  jobSource: '',
  executiveSummary: 'Ringkasan.',
  overallScore: 140,
  scoreLabel: 'Kuat.',
  strengths: ['React'],
  improvements: [],
  matchOverview: [
    {
      area: 'React',
      jobNeed: 'React',
      cvEvidence: 'Ada React',
      match: 'strong',
      note: 'Cukup',
    },
  ],
  recommendations: ['Tambah metrik'],
  nextSteps: ['Revisi'],
  alreadyGood: ['Rapi'],
  potential: 'Bisa lebih kuat.',
  conclusion: 'Layak dilanjutkan.',
})
assert(review.overallScore === 100, 'skor harus dipotong ke 100')
assert(review.matchOverview[0]?.match === 'Strong', 'match harus dinormalisasi')

let rejected = false
try {
  parseReview({ executiveSummary: '' })
} catch (error) {
  rejected = error instanceof ReviewError && error.status === 502
}
assert(rejected, 'parseReview harus menolak hasil kosong')

const base = {
  origin: 'http://localhost:5173',
  host: 'localhost:5173',
  apiKey: undefined,
  model: undefined,
}

const missingKey = await handleReviewRequest({
  ...base,
  method: 'POST',
  body: { jobDescription: 'Frontend developer', cvText: 'Budi Santoso, React' },
})
assert(missingKey.status === 500, `tanpa kunci harus 500, dapat ${missingKey.status}`)

const crossSite = await handleReviewRequest({
  ...base,
  method: 'POST',
  origin: 'https://evil.example',
  body: { jobDescription: 'Frontend', cvText: 'CV' },
  apiKey: 'secret',
})
assert(crossSite.status === 403, `origin asing harus 403, dapat ${crossSite.status}`)

const emptyJob = await handleReviewRequest({
  ...base,
  method: 'POST',
  body: { jobDescription: '   ', cvText: 'CV yang cukup panjang' },
  apiKey: 'secret',
})
assert(emptyJob.status === 400, `job kosong harus 400, dapat ${emptyJob.status}`)

const wrongMethod = await handleReviewRequest({
  ...base,
  method: 'GET',
  body: {},
  apiKey: 'secret',
})
assert(wrongMethod.status === 405, `GET harus 405, dapat ${wrongMethod.status}`)

console.log('logic checks passed')
