export const MATCH_LEVELS = ['Strong', 'Partial', 'Missing'] as const

export type MatchLevel = (typeof MATCH_LEVELS)[number]

export type MatchRow = {
  area: string
  jobNeed: string
  cvEvidence: string
  match: MatchLevel
  note: string
}

export type CvReview = {
  candidateName: string
  targetRole: string
  companyName: string
  jobSource: string
  executiveSummary: string
  overallScore: number
  scoreLabel: string
  strengths: string[]
  improvements: string[]
  matchOverview: MatchRow[]
  recommendations: string[]
  nextSteps: string[]
  alreadyGood: string[]
  potential: string
  conclusion: string
}

export const responseSchema = {
  type: 'OBJECT',
  properties: {
    candidateName: { type: 'STRING' },
    targetRole: { type: 'STRING' },
    companyName: { type: 'STRING' },
    jobSource: { type: 'STRING' },
    executiveSummary: { type: 'STRING' },
    overallScore: { type: 'INTEGER' },
    scoreLabel: { type: 'STRING' },
    strengths: { type: 'ARRAY', items: { type: 'STRING' } },
    improvements: { type: 'ARRAY', items: { type: 'STRING' } },
    matchOverview: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          area: { type: 'STRING' },
          jobNeed: { type: 'STRING' },
          cvEvidence: { type: 'STRING' },
          match: { type: 'STRING', enum: ['Strong', 'Partial', 'Missing'] },
          note: { type: 'STRING' },
        },
        required: ['area', 'jobNeed', 'cvEvidence', 'match', 'note'],
      },
    },
    recommendations: { type: 'ARRAY', items: { type: 'STRING' } },
    nextSteps: { type: 'ARRAY', items: { type: 'STRING' } },
    alreadyGood: { type: 'ARRAY', items: { type: 'STRING' } },
    potential: { type: 'STRING' },
    conclusion: { type: 'STRING' },
  },
  required: [
    'candidateName',
    'targetRole',
    'companyName',
    'jobSource',
    'executiveSummary',
    'overallScore',
    'scoreLabel',
    'strengths',
    'improvements',
    'matchOverview',
    'recommendations',
    'nextSteps',
    'alreadyGood',
    'potential',
    'conclusion',
  ],
} as const

export class ReviewError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ReviewError'
    this.status = status
  }
}

function asText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function asList(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)
}

function asMatch(value: unknown): MatchLevel | null {
  if (typeof value !== 'string') return null
  const normalized = value.trim().toLowerCase()
  if (normalized === 'strong') return 'Strong'
  if (normalized === 'partial') return 'Partial'
  if (normalized === 'missing') return 'Missing'
  return null
}

export function parseReview(value: unknown): CvReview {
  if (!value || typeof value !== 'object') {
    throw new ReviewError(502, 'Hasil analisis tidak lengkap. Coba lagi.')
  }

  const record = value as Record<string, unknown>
  const executiveSummary = asText(record.executiveSummary)
  const scoreLabel = asText(record.scoreLabel)
  const potential = asText(record.potential)
  const conclusion = asText(record.conclusion)
  const score = Number(record.overallScore)

  if (!executiveSummary || !scoreLabel || !potential || !conclusion || !Number.isFinite(score)) {
    throw new ReviewError(502, 'Hasil analisis tidak lengkap. Coba lagi.')
  }

  const matchOverview = Array.isArray(record.matchOverview)
    ? record.matchOverview.flatMap((item) => {
        if (!item || typeof item !== 'object') return []
        const row = item as Record<string, unknown>
        const match = asMatch(row.match)
        const area = asText(row.area)
        const jobNeed = asText(row.jobNeed)
        const cvEvidence = asText(row.cvEvidence)
        const note = asText(row.note)
        if (!match || !area || !jobNeed || !cvEvidence || !note) return []
        return [{ area, jobNeed, cvEvidence, match, note }]
      })
    : []

  if (matchOverview.length === 0) {
    throw new ReviewError(502, 'Hasil analisis tidak lengkap. Coba lagi.')
  }

  return {
    candidateName: asText(record.candidateName),
    targetRole: asText(record.targetRole),
    companyName: asText(record.companyName),
    jobSource: asText(record.jobSource),
    executiveSummary,
    overallScore: Math.max(0, Math.min(100, Math.round(score))),
    scoreLabel,
    strengths: asList(record.strengths),
    improvements: asList(record.improvements),
    matchOverview,
    recommendations: asList(record.recommendations),
    nextSteps: asList(record.nextSteps),
    alreadyGood: asList(record.alreadyGood),
    potential,
    conclusion,
  }
}
