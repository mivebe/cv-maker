import * as pdfjs from 'pdfjs-dist'
// Vite resolves this to a hashed URL for the pdf.js worker bundle.
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl

/**
 * Extract all text from a PDF file in reading order, exactly as a text-based
 * ATS parser would. If this returns (almost) nothing, the PDF is a rasterized
 * image and would fail ATS parsing.
 */
export async function extractPdfText(file: File): Promise<string> {
  const buf = await file.arrayBuffer()
  const doc = await pdfjs.getDocument({ data: buf }).promise
  const pages: string[] = []
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p)
    const content = await page.getTextContent()
    const text = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
    pages.push(text)
  }
  await doc.destroy()
  return pages.join('\n\n')
}
