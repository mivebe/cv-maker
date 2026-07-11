import { useReactToPrint } from 'react-to-print'
import type { RefObject } from 'react'
import { Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
  return (
    <Button variant="default" onClick={() => print()}>
      <Printer />
      Export PDF / Print
    </Button>
  )
}
