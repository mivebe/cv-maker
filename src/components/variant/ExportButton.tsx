import { useReactToPrint } from 'react-to-print'
import type { RefObject } from 'react'
import { Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { iconsSettled } from '@/cv/icons'

/**
 * Exports the CV via the browser's native print pipeline. Choosing "Save as
 * PDF" in the print dialog yields a PDF with real, selectable text (ATS-safe),
 * not a rasterized image.
 */
export function ExportButton({
  docRef,
  documentTitle,
}: {
  docRef: RefObject<HTMLDivElement | null>
  documentTitle: string
}) {
  const print = useReactToPrint({
    contentRef: docRef,
    documentTitle,
  })

  // Brand glyphs are fetched on first draw, and print snapshots the live DOM -
  // so a glyph still in flight would print as a blank box. Drain them first.
  const exportPdf = async () => {
    await iconsSettled()
    print()
  }

  return (
    <Button
      variant="default"
      className="h-9 self-start"
      onClick={() => void exportPdf()}
    >
      <Printer />
      Export PDF <span className="hidden sm:inline">/ Print</span>
    </Button>
  )
}
