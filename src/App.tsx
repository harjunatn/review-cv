import { useEffect, useRef, useState } from 'react'
import { ReviewForm, type ExtractState } from './components/ReviewForm.tsx'
import { ReviewReport } from './components/ReviewReport.tsx'
import { extractCv } from './lib/extractCv.ts'
import { LIMITS } from './lib/limits.ts'
import { parseReview, type CvReview } from './lib/schema.ts'
import { previewReview } from './lib/previewReview.ts'
import './report.css'

function initialReview(): CvReview | null {
  if (!import.meta.env.DEV) return null
  const params = new URLSearchParams(window.location.search)
  return params.has('preview') ? previewReview : null
}

function App() {
  const [jobDescription, setJobDescription] = useState('')
  const [extract, setExtract] = useState<ExtractState>({ status: 'idle' })
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [review, setReview] = useState<CvReview | null>(initialReview)
  const requestId = useRef(0)

  useEffect(() => {
    if (review) window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [review])

  async function onFile(file: File) {
    const id = requestId.current + 1
    requestId.current = id
    setSubmitError(null)
    setExtract({ status: 'working', message: 'Membaca teks PDF...', fileName: file.name })

    try {
      const result = await extractCv(file, (message) => {
        if (requestId.current === id) {
          setExtract({ status: 'working', message, fileName: file.name })
        }
      })
      if (requestId.current !== id) return

      const pageNote =
        result.pageCount > LIMITS.maxPdfPages
          ? ` ${LIMITS.maxPdfPages} halaman pertama yang dibaca.`
          : ''
      const methodNote =
        result.method === 'ocr' ? 'Teks dibaca dengan OCR karena PDF seperti hasil scan.' : 'Teks berhasil dibaca dari PDF.'
      const truncateNote = result.truncated
        ? ` Dipotong ke ${LIMITS.cvText.toLocaleString('id-ID')} karakter pertama.`
        : ''

      setExtract({
        status: 'ready',
        fileName: file.name,
        text: result.text,
        note: `${file.name}. ${methodNote}${pageNote}${truncateNote}`,
      })
    } catch (error) {
      if (requestId.current !== id) return
      setExtract({
        status: 'error',
        fileName: file.name,
        message: error instanceof Error ? error.message : 'Gagal membaca PDF.',
      })
    }
  }

  async function onSubmit() {
    if (extract.status !== 'ready' || submitting) return
    setSubmitting(true)
    setSubmitError(null)

    try {
      const response = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobDescription: jobDescription.trim(),
          cvText: extract.text,
        }),
      })
      const payload: unknown = await response.json().catch(() => null)
      if (!response.ok) {
        const message =
          payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string'
            ? payload.error
            : 'Analisis gagal. Coba lagi.'
        throw new Error(message)
      }
      setReview(parseReview(payload))
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Analisis gagal. Coba lagi.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="app">
      <header className="topbar no-print">
        <div>
          <p className="brand">Better CV</p>
          <strong>Review CV</strong>
        </div>
        <p>Tempel lowongan, unggah PDF, lalu cetak hasil review-nya.</p>
      </header>

      <main>
        {review ? (
          <ReviewReport review={review} onPrint={() => window.print()} onReset={() => setReview(null)} />
        ) : (
          <ReviewForm
            jobDescription={jobDescription}
            extract={extract}
            submitting={submitting}
            submitError={submitError}
            onJobDescription={setJobDescription}
            onFile={(file) => {
              void onFile(file)
            }}
            onSubmit={() => {
              void onSubmit()
            }}
          />
        )}
      </main>
    </div>
  )
}

export default App
