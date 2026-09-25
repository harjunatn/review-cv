import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'
import { itemsToText } from '../src/lib/textItems.ts'

const content = `BT
/F1 18 Tf
72 720 Td
(Budi Santoso Frontend Developer React TypeScript) Tj
ET`
const stream = Buffer.from(content)
const objects = [
  '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
  '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
  '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n',
  `4 0 obj\n<< /Length ${stream.length} >>\nstream\n${content}\nendstream\nendobj\n`,
  '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
]

let body = '%PDF-1.4\n'
const offsets = [0]
for (const object of objects) {
  offsets.push(Buffer.byteLength(body))
  body += object
}
const xrefStart = Buffer.byteLength(body)
let xref = `xref\n0 6\n0000000000 65535 f \n`
for (let index = 1; index <= 5; index += 1) {
  xref += `${String(offsets[index]).padStart(10, '0')} 00000 n \n`
}
body += `${xref}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`

const dir = await mkdtemp(join(tmpdir(), 'reviewcv-'))
const pdfPath = join(dir, 'sample.pdf')
await writeFile(pdfPath, body)

const data = new Uint8Array(await readFile(pdfPath))
const task = getDocument({ data })
const pdf = await task.promise
const page = await pdf.getPage(1)
const textContent = await page.getTextContent()
const text = itemsToText(textContent.items)
await task.destroy()
await rm(dir, { recursive: true })

if (!text.includes('Budi Santoso') || !text.includes('React')) {
  throw new Error(`Ekstraksi PDF gagal: ${text}`)
}

console.log('pdf extract passed:', text)
