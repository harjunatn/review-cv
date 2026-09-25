import type { CvReview } from './schema.ts'

export const previewReview: CvReview = {
  candidateName: 'Contoh Kandidat',
  targetRole: 'Senior Full Stack Software Engineer',
  companyName: 'Contoh Tech Company',
  jobSource: 'Lowongan yang ditempel',
  executiveSummary:
    'Kamu adalah kandidat dengan pengalaman kuat di backend dan full stack development. Secara keseluruhan, CV kamu sudah cukup relevan dengan posisi yang dituju.\n\nNamun, ada beberapa area yang masih perlu diperjelas agar lebih kuat di mata recruiter, terutama Kubernetes, security, dan object storage.',
  overallScore: 78,
  scoreLabel: 'Cukup sesuai. Dengan beberapa perbaikan, CV ini berpotensi menjadi sangat kuat untuk posisi yang dituju.',
  strengths: [
    'Pengalaman 5+ tahun di pengembangan produk digital',
    'Backend Node.js dan database PostgreSQL serta Redis terlihat jelas',
    'Pernah mengerjakan frontend dengan React dan Next.js',
    'Ada contoh pencapaian terukur pada proyek sebelumnya',
  ],
  improvements: [
    'Pengalaman Kubernetes belum terlihat jelas di CV',
    'Belum ada mention spesifik terkait object storage',
    'Security-related experience belum dijelaskan',
    'Penggunaan AI agents atau LLM belum terlihat',
    'Beberapa pencapaian masih bisa dibuat lebih kuantitatif',
  ],
  matchOverview: [
    {
      area: 'Frontend (React/Next.js)',
      jobNeed: 'Memimpin pengembangan konten',
      cvEvidence: 'Ada pengalaman menggunakan React',
      match: 'Strong',
      note: 'Good, bisa tambah detail scope dan hasil',
    },
    {
      area: 'Backend (Node.js, dbs)',
      jobNeed: 'Pengembangan backend dan API',
      cvEvidence: 'Ada Node.js, PostgreSQL, Redis',
      match: 'Strong',
      note: 'Sangat relevan',
    },
    {
      area: 'DevOps (Docker, K8s)',
      jobNeed: 'Container, Kubernetes, CI/CD',
      cvEvidence: 'Ada Docker, Kubernetes belum jelas',
      match: 'Partial',
      note: 'Perjelas pengalaman Kubernetes',
    },
    {
      area: 'Object storage',
      jobNeed: 'S3-compatible (AWS S3, MinIO, R2)',
      cvEvidence: 'Tidak dibahas',
      match: 'Missing',
      note: 'Jika pernah pakai, sebaiknya ditambahkan',
    },
    {
      area: 'Security',
      jobNeed: 'Secure coding, auth, threat modeling',
      cvEvidence: 'Tidak terlihat jelas',
      match: 'Missing',
      note: 'Tambahkan jika ada pengalaman',
    },
  ],
  recommendations: [
    'Tambahkan pengalaman Kubernetes dengan contoh nyata penggunaannya.',
    'Jelaskan pengalaman object storage jika pernah.',
    'Tambahkan informasi authentication, authorization, atau OWASP.',
    'Cantumkan penggunaan AI tools jika memang pernah dipakai.',
    'Buat pencapaian lebih kuantitatif, misalnya peningkatan performa API.',
  ],
  nextSteps: [
    'Revisi CV berdasarkan rekomendasi di atas.',
    'Jika ada, tambahkan detail proyek atau pengalaman yang belum tertulis.',
    'Sesuaikan CV dengan kata kunci pada job description tanpa melebih-lebihkan.',
    'Setelah revisi, cek ulang kecocokan terhadap lowongan yang sama.',
  ],
  alreadyGood: [
    'Struktur CV rapi dan mudah dibaca.',
    'Pengalaman kerja relevan dengan industri dan posisi yang dituju.',
    'Ada proyek nyata yang menunjukkan kemampuan teknis.',
  ],
  potential:
    'Dengan menambahkan beberapa detail yang masih kurang, terutama Kubernetes, security, dan object storage, CV ini bisa menjadi jauh lebih kuat.',
  conclusion:
    'CV kamu sudah memiliki fondasi yang kuat. Dengan perbaikan pada beberapa area, kamu berpotensi menjadi kandidat yang sangat kompetitif untuk posisi ini.',
}
