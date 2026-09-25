import type { ReactNode } from 'react'
import type { CvReview, MatchLevel } from '../lib/schema.ts'

type ReviewReportProps = {
  review: CvReview
  onPrint: () => void
  onReset: () => void
}

export function ReviewReport({ review, onPrint, onReset }: ReviewReportProps) {
  const summary = review.executiveSummary.split(/\n+/).filter(Boolean)

  return (
    <div className="report-screen">
      <div className="toolbar no-print">
        <button type="button" onClick={onReset} className="ghost">
          Review lagi
        </button>
        <button type="button" onClick={onPrint}>
          Cetak
        </button>
      </div>

      <article className="report">
        <header className="report-hero">
          <p className="eyebrow">CV & Job Match Review Report</p>
          <h1>Hasil Review CV</h1>
          <p className="lede">
            Laporan ini membandingkan CV dengan lowongan yang kamu tempel, lalu menunjukkan skor,
            celah, dan perbaikan yang bisa langsung ditulis.
          </p>
        </header>

        <dl className="meta">
          <Meta icon="person" label="Nama Kandidat" value={review.candidateName} />
          <Meta icon="role" label="Target Posisi" value={review.targetRole} />
          <Meta icon="company" label="Nama Perusahaan" value={review.companyName} />
          <Meta icon="source" label="Sumber Jobdesc" value={review.jobSource} />
        </dl>

        <div className="columns">
          <div className="stack">
            <section className="card">
              <SectionTitle index="1" title="Executive Summary" />
          {summary.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
              <div className="score">
                <div className="score-copy">
                  <span className="score-kicker">Overall Job Match</span>
                  <strong>{review.overallScore}%</strong>
                  <p>{review.scoreLabel}</p>
                </div>
                <div
                  className="score-track"
                  role="meter"
                  aria-valuenow={review.overallScore}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Overall job match"
                >
                  <span style={{ width: `${review.overallScore}%` }} />
                </div>
              </div>
            </section>

            <section className="card strengths">
              <SectionTitle index="2" title="Key Strengths" />
              <BulletList items={review.strengths} marker="check" empty="Belum ada kekuatan yang tercatat." />
            </section>

            <section className="card gaps">
              <SectionTitle index="3" title="Areas to Improve" />
              <NumberedList items={review.improvements} tone="gap" empty="Belum ada area perbaikan." />
            </section>
          </div>

          <div className="stack">
            <section className="card">
              <SectionTitle index="4" title="Job Requirement Match Overview" />
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Area Requirement</th>
                      <th>Kebutuhan di Jobdesc</th>
                      <th>Evidence di CV</th>
                      <th>Match</th>
                      <th>Catatan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {review.matchOverview.map((row, index) => (
                      <tr key={`${row.area}-${index}`}>
                        <td data-label="Area">{row.area}</td>
                        <td data-label="Kebutuhan">{row.jobNeed}</td>
                        <td data-label="Evidence">{row.cvEvidence}</td>
                        <td data-label="Match">
                          <MatchBadge level={row.match} />
                        </td>
                        <td data-label="Catatan">{row.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="card">
              <SectionTitle index="5" title="Rekomendasi Perbaikan CV" />
              <NumberedList
                items={review.recommendations}
                tone="advice"
                empty="Belum ada rekomendasi."
              />
            </section>

            <section className="card">
              <SectionTitle index="6" title="Next Steps" />
              <NumberedList items={review.nextSteps} tone="next" empty="Belum ada langkah berikutnya." />
            </section>
          </div>
        </div>

        <div className="bottom">
          <aside className="insight good">
            <h2>Hal yang Sudah Bagus</h2>
            <BulletList items={review.alreadyGood} marker="dot" empty="Belum ada catatan." />
          </aside>
          <aside className="insight potential">
            <h2>Potensi Jika Diperbaiki</h2>
            <p>{review.potential}</p>
          </aside>
          <aside className="insight conclusion">
            <h2>Kesimpulan</h2>
            <p>{review.conclusion}</p>
          </aside>
        </div>

        <footer className="report-foot">
          <p>
            Review ini dihasilkan AI dari teks CV dan lowongan yang kamu kirim. Cocokkan kembali
            dengan dokumen asli sebelum mengubah CV.
          </p>
          <strong>Better CV</strong>
        </footer>
      </article>
    </div>
  )
}

function Meta({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div>
      <Icon name={icon} />
      <dt>{label}</dt>
      <dd>{value || 'Tidak disebutkan'}</dd>
    </div>
  )
}

function SectionTitle({ index, title }: { index: string; title: string }) {
  return (
    <h2>
      <span>{index}</span>
      {title}
    </h2>
  )
}

function BulletList({
  items,
  marker,
  empty,
}: {
  items: string[]
  marker: 'check' | 'dot'
  empty: string
}) {
  if (items.length === 0) return <p className="empty">{empty}</p>
  return (
    <ul className={marker}>
      {items.map((item, index) => (
        <li key={`${index}-${item}`}>{item}</li>
      ))}
    </ul>
  )
}

function NumberedList({
  items,
  tone,
  empty,
}: {
  items: string[]
  tone: 'gap' | 'advice' | 'next'
  empty: string
}) {
  if (items.length === 0) return <p className="empty">{empty}</p>
  return (
    <ol className={tone}>
      {items.map((item, index) => (
        <li key={`${index}-${item}`}>{item}</li>
      ))}
    </ol>
  )
}

function MatchBadge({ level }: { level: MatchLevel }) {
  return <span className={`badge ${level.toLowerCase()}`}>{level}</span>
}

function Icon({ name }: { name: string }) {
  const paths: Record<string, ReactNode> = {
    person: (
      <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-3.3 0-8 1.7-8 5v1h16v-1c0-3.3-4.7-5-8-5Z" />
    ),
    role: (
      <path d="M4 7h6V5a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v2h6a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1Zm8-2v2h0V5Zm-7 6h14" />
    ),
    company: <path d="M4 20V6l8-3 8 3v14H4Zm4-2h2v-3H8v3Zm6 0h2v-3h-2v3ZM8 12h2V9H8v3Zm6 0h2V9h-2v3Z" />,
    source: <path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm6 1.5V9h4.5M8 13h8M8 17h6" />,
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {paths[name]}
    </svg>
  )
}
