export const LIMITS = {
  jobDescription: 15_000,
  cvText: 30_000,
  maxPdfBytes: 10 * 1024 * 1024,
  ocrThreshold: 400,
  minCvChars: 80,
  maxOcrPages: 4,
  maxPdfPages: 15,
  maxBodyBytes: 120_000,
} as const
