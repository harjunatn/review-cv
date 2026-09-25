import type { FormEvent } from 'react'
import { LIMITS } from '../lib/limits.ts'

export type ExtractState =
  | { status: 'idle' }
  | { status: 'working'; message: string; fileName: string }
  | {
      status: 'ready'
      fileName: string
      text: string
      note: string
    }
  | { status: 'error'; message: string; fileName?: string }

type ReviewFormProps = {
  jobDescription: string
  extract: ExtractState
  submitting: boolean
  submitError: string | null
  onJobDescription: (value: string) => void
  onFile: (file: File) => void
  onSubmit: () => void
}

export function ReviewForm({
  jobDescription,
  extract,
  submitting,
  submitError,
  onJobDescription,
  onFile,
  onSubmit,
}: ReviewFormProps) {
  const ready = extract.status === 'ready'
  const jobLength = jobDescription.trim().length
  const canSubmit = ready && jobLength > 0 && !submitting

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (canSubmit) onSubmit()
  }

  return (
    <form className="composer" onSubmit={handleSubmit}>
      <div className="composer-grid">
        <label className="field">
          <span className="field-label">Job description</span>
          <textarea
            value={jobDescription}
            onChange={(event) => onJobDescription(event.target.value)}
            placeholder="Tempel requirement, tanggung jawab, dan kualifikasi lowongan di sini."
            maxLength={LIMITS.jobDescription}
            rows={14}
          />
          <span className="counter">
            {jobLength.toLocaleString('id-ID')} / {LIMITS.jobDescription.toLocaleString('id-ID')}
          </span>
        </label>

        <div className="field">
          <span className="field-label">CV (PDF)</span>
          <label
            className="dropzone"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault()
              const file = event.dataTransfer.files[0]
              if (file) onFile(file)
            }}
          >
            <input
              type="file"
              accept="application/pdf,.pdf"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) onFile(file)
                event.target.value = ''
              }}
            />
            <strong>Pilih PDF atau jatuhkan di sini</strong>
            <span>Maksimal 10 MB. File tetap di browser; yang dikirim hanya teksnya.</span>
          </label>
          <ExtractNote extract={extract} />
        </div>
      </div>

      {ready ? (
        <div className="preview">
          <div className="preview-head">
            <strong>Teks yang akan dianalisis</strong>
            <span>{extract.text.length.toLocaleString('id-ID')} karakter</span>
          </div>
          <pre>{extract.text}</pre>
        </div>
      ) : null}

      {submitError ? <p className="banner error">{submitError}</p> : null}

      <div className="composer-actions">
        <button type="submit" disabled={!canSubmit}>
          {submitting ? 'Menganalisis kecocokan...' : 'Review CV'}
        </button>
        <p>Hasilnya bisa langsung dicetak. Isi CV tidak disimpan.</p>
      </div>
    </form>
  )
}

function ExtractNote({ extract }: { extract: ExtractState }) {
  if (extract.status === 'idle') return <p className="hint">Belum ada file.</p>
  if (extract.status === 'working') {
    return (
      <p className="hint working" role="status">
        {extract.fileName}: {extract.message}
      </p>
    )
  }
  if (extract.status === 'error') {
    return (
      <p className="hint error" role="alert">
        {extract.message}
      </p>
    )
  }
  return <p className="hint ready">{extract.note}</p>
}
