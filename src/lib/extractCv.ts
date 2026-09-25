import { LIMITS } from './limits.ts'
import { itemsToText } from './textItems.ts'
import type { PDFDocumentProxy } from 'pdfjs-dist'

export type ExtractedCv = {
  text: string
  method: 'text' | 'ocr'
  truncated: boolean
  pageCount: number
}

function tidy(text: string): string {
  return text
    .replace(/[ \t]+\n/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function namedError(error: unknown, name: string): boolean {
  return error instanceof Error && error.name === name
}

async function extractDigitalText(pdf: PDFDocumentProxy): Promise<string> {
  const pages = Math.min(pdf.numPages, LIMITS.maxPdfPages)
  const chunks: string[] = []

  for (let pageNumber = 1; pageNumber <= pages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber)
    const content = await page.getTextContent()
    chunks.push(itemsToText(content.items))
    page.cleanup()
  }

  return tidy(chunks.join('\n\n'))
}

async function extractOcrText(
  pdf: PDFDocumentProxy,
  onProgress: (message: string) => void,
): Promise<string> {
  const pages = Math.min(pdf.numPages, LIMITS.maxOcrPages)
  onProgress('Menyiapkan OCR untuk CV hasil scan...')
  const { createWorker } = await import('tesseract.js')
  const worker = await createWorker(['ind', 'eng'])

  try {
    const chunks: string[] = []
    for (let pageNumber = 1; pageNumber <= pages; pageNumber += 1) {
      onProgress(`Membaca halaman scan ${pageNumber} dari ${pages}...`)
      const page = await pdf.getPage(pageNumber)
      const base = page.getViewport({ scale: 1 })
      const scale = Math.min(2, 1800 / Math.max(base.width, base.height))
      const viewport = page.getViewport({ scale })
      const canvas = document.createElement('canvas')
      canvas.width = Math.floor(viewport.width)
      canvas.height = Math.floor(viewport.height)
      await page.render({ canvas, viewport }).promise
      const result = await worker.recognize(canvas)
      chunks.push(result.data.text)
      page.cleanup()
    }
    return tidy(chunks.join('\n\n'))
  } finally {
    await worker.terminate()
  }
}

export async function extractCv(
  file: File,
  onProgress: (message: string) => void,
): Promise<ExtractedCv> {
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
  if (!isPdf) throw new Error('Unggah file PDF.')
  if (file.size > LIMITS.maxPdfBytes) throw new Error('Ukuran PDF maksimal 10 MB.')

  onProgress('Membaca teks PDF...')
  const pdfjs = await import('pdfjs-dist')
  const workerModule = await import('pdfjs-dist/build/pdf.worker.min.mjs?url')
  pdfjs.GlobalWorkerOptions.workerSrc = workerModule.default
  const data = new Uint8Array(await file.arrayBuffer())
  const task = pdfjs.getDocument({ data })

  let pdf: PDFDocumentProxy
  try {
    pdf = await task.promise
  } catch (error) {
    await task.destroy()
    if (namedError(error, 'PasswordException')) {
      throw new Error('PDF ini terkunci. Unggah versi tanpa password.')
    }
    if (namedError(error, 'InvalidPDFException')) {
      throw new Error('File ini bukan PDF yang bisa dibaca.')
    }
    throw new Error('Gagal membaca PDF di browser.')
  }

  try {
    if (pdf.numPages < 1) throw new Error('PDF ini tidak memiliki halaman.')

    let text = await extractDigitalText(pdf)
    let method: ExtractedCv['method'] = 'text'

    if (text.length < LIMITS.ocrThreshold) {
      try {
        const ocrText = await extractOcrText(pdf, onProgress)
        const digitalIsWeak = text.length < LIMITS.minCvChars
        const ocrIsMuchRicher =
          ocrText.length > text.length * 2 && ocrText.length >= LIMITS.minCvChars
        if ((digitalIsWeak || ocrIsMuchRicher) && ocrText.length > text.length) {
          text = ocrText
          method = 'ocr'
        }
      } catch {
        if (text.length < LIMITS.minCvChars) {
          throw new Error('Teks pada PDF tidak terbaca. Unggah PDF yang teksnya bisa dipilih.')
        }
      }
    }

    if (text.length < LIMITS.minCvChars) {
      throw new Error('Teks pada PDF terlalu sedikit untuk dianalisis.')
    }

    const truncated = text.length > LIMITS.cvText
    return {
      text: truncated ? text.slice(0, LIMITS.cvText) : text,
      method,
      truncated,
      pageCount: pdf.numPages,
    }
  } finally {
    await task.destroy()
  }
}
