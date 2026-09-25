# Review CV

Aplikasi React untuk membandingkan CV (PDF) dengan job description memakai Gemini.

## Setup lokal

1. Salin `.env.example` ke `.env.local`
2. Isi `GEMINI_API_KEY`
3. Jalankan `npm install` lalu `npm run dev`
4. Buka http://localhost:5173

PDF dibaca di browser; yang dikirim ke server hanya teks CV dan teks lowongan.

## Deploy Vercel

1. Push repo, hubungkan ke Vercel
2. Set Environment Variable `GEMINI_API_KEY` (Production + Preview), tanpa prefix `VITE_`
3. Redeploy setelah menyimpan variable
4. Opsional: batasi `POST /api/review` di Vercel Firewall

Build otomatis menghasilkan `api/review.js` (bundle serverless).
